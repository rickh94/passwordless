import datetime
import logging
import os
import secrets
import string
from typing import Union
from urllib.parse import quote_plus

import jwt
import redis
from fastapi import HTTPException, Security, Depends
from fastapi.openapi.models import OAuthFlows
from fastapi.security import OAuth2
from passlib.context import CryptContext
from starlette.requests import Request
from starlette.status import HTTP_401_UNAUTHORIZED

from app.auth import models, crud

logger = logging.getLogger()


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
        logger.debug("getting token")
        token = request.cookies.get(self._token_name)
        logger.debug(token)
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
OTPS = redis.Redis(host=os.getenv("REDIS_HOST"), port=os.getenv("REDIS_PORT"), db=0)
URL_SECRETS = redis.Redis(
    host=os.getenv("REDIS_HOST"), port=os.getenv("REDIS_PORT"), db=1
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = Passwordless(tokenUrl="/auth/confirm", authorizationUrl="/auth/request")


def generate_otp(email: str) -> str:
    alphabet = string.ascii_letters + string.digits
    code = "".join(secrets.choice(alphabet) for _ in range(8))
    code_hash = pwd_context.hash(code)
    OTPS.set(f"otp:{email}", code_hash)
    OTPS.expire(f"otp:{email}", datetime.timedelta(minutes=5))
    return code


def generate_magic_link(email: str) -> str:
    url_secret = secrets.token_urlsafe()
    secret_hash = pwd_context.hash(url_secret)
    URL_SECRETS.set(f"url_secret:{email}", secret_hash)
    URL_SECRETS.expire(f"url_secret:{email}", datetime.timedelta(minutes=5))
    host = os.getenv("HOSTNAME", "localhost")
    return f"{host}?secret={url_secret}"


def verify_magic_link(email: str, secret: str):
    secret_hash = URL_SECRETS.get(f"url_secret:{email}")
    if not secret_hash:
        return False
    success = pwd_context.verify(secret, secret_hash)
    if success:
        URL_SECRETS.expire(f"url_secret:{email}", datetime.timedelta(seconds=1))
    return success


def verify_otp(email: str, code: str) -> bool:
    code_hash = OTPS.get(f"otp:{email}")
    if not code_hash:
        return False
    success = pwd_context.verify(code, code_hash)
    if success:
        OTPS.expire(f"otp:{email}", datetime.timedelta(seconds=1))
    return success


async def authenticate_user(email: str, code: str) -> Union[models.UserInDB, bool]:
    user = await crud.get_user_by_email(email)
    if not user:
        return False
    if not verify_otp(email, code):
        return False
    return user


async def authenticate_user_magic(email: str, secret: str):
    user = await crud.get_user_by_email(email)
    if not user:
        return False
    if not verify_magic_link(email, secret):
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


async def get_current_user(token: str = Security(oauth2_scheme)) -> models.UserInDB:
    credentials_exception = HTTPException(
        status_code=HTTP_401_UNAUTHORIZED, detail=f"Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.debug(payload)
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError as err:
        logger.debug(err)
        raise credentials_exception
    user = await crud.get_user_by_email(email)
    if not user:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
