import datetime
import os
import secrets
import string
from typing import Union

import jwt
from fastapi import HTTPException, Security
from fastapi.openapi.models import OAuthFlows
from fastapi.security import OAuth2
from passlib.context import CryptContext
from starlette.requests import Request
from starlette.status import HTTP_401_UNAUTHORIZED

from app.auth import models, crud


class Passwordless(OAuth2):
    def __init__(
        self,
        *args,
        tokenUrl: str,
        authorizationUrl: str,
        token_name: str = None,
        **kwargs,
    ):
        flows = OAuthFlows(
            authorizationCode={
                "tokenUrl": tokenUrl,
                "authorizationUrl": authorizationUrl,
            }
        )
        super().__init__(flows=flows, *args, **kwargs)
        self._token_name = token_name or "token"

    @property
    def token_name(self) -> str:
        return self._token_name

    async def __call__(self, request: Request) -> str:
        """Extract token from cookies"""
        token = request.cookies.get(self._token_name)
        if not token:
            raise HTTPException(status_code=401, detail="Not Authorized")
        return token


def get_secret_key():
    secret = os.getenv("SECRET_KEY")
    if not secret or secret == "GENERATE_A_KEY":
        print("You need to generate a secret key")
        raise SystemExit(1)
    return secret


SECRET_KEY = get_secret_key()
ALGORITHM = "HS256"
OTPS = {}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = Passwordless(tokenURL="/auth/confirm", authorizationUrl="/auth/request")


def generate_otp(email: str) -> str:
    alphabet = string.ascii_letters + string.digits
    code = "".join(secrets.choice(alphabet) for i in range(8))
    code_hash = pwd_context.hash(code)
    OTPS[email] = code_hash
    return code


def verify_otp(email: str, code: str) -> bool:
    return pwd_context.verify(code, OTPS[email])


async def authenticate_user(email: str, code: str) -> Union[models.UserInDB, bool]:
    user = await crud.get_user_by_email(email)
    if not user:
        return False
    if not verify_otp(email, code):
        return False
    return user


def create_access_token(*, data: dict, expires_delta: datetime.timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM).decode("utf-8")
    return encoded_jwt


async def get_current_user(token: str = Security(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=HTTP_401_UNAUTHORIZED, detail=f"Could not validate credentials"
    )
    # try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email: str = payload.get("sub")
