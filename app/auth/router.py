import datetime
import logging
import os

import aiohttp
from fastapi import APIRouter, Depends, Body, HTTPException
from starlette.responses import UJSONResponse
from starlette.status import (
    HTTP_401_UNAUTHORIZED,
    HTTP_201_CREATED,
    HTTP_400_BAD_REQUEST,
)

from app.auth import models, security, crud
from app.auth.security import oauth2_scheme

auth_router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
mailgun_key = os.getenv("MAILGUN_KEY")

logger = logging.getLogger()


@auth_router.post("/request")
async def request_login(data: models.AuthRequest = Body(...)):
    user = await crud.get_user_by_email(data.email)
    if not user:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST, detail="No user with that email."
        )
    otp = security.generate_otp(data.email)
    async with aiohttp.ClientSession() as session:
        res = await session.post(
            "https://api.mailgun.net/v3/mg.temptestsites.online/messages",
            auth=aiohttp.BasicAuth("api", mailgun_key),
            data={
                "from": "Passwordless <postmaster@mg.temptestsites.online>",
                "to": data.email,
                "subject": "Your One Time Password",
                "text": f"Your password is {otp}",
            },
        )
        if res.status != 200:
            raise HTTPException(status_code=500, detail="Could not send email.")
    return "Please check your email for a single use password."


@auth_router.post("/confirm")
async def confirm_login(data: models.OTP = Body(...)):
    user = await security.authenticate_user(data.email, data.code)
    logger.debug(user)
    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="Invalid Email or Code"
        )
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    response = UJSONResponse({"status": "authenticated"})
    response.set_cookie(oauth2_scheme.token_name, access_token, httponly=True)
    return response


@auth_router.post(
    "/register",
    response_model=models.User,
    status_code=HTTP_201_CREATED,
    responses={400: {"description": "Email is invalid"}},
)
async def register(user: models.User = Body(...)):
    if await crud.get_user_by_email(user.email):
        raise HTTPException(
            status_code=400, detail="A user with that email already exists"
        )
    new_user = models.UserInDB.parse_obj(user)
    created_user = await crud.create_user(new_user)
    return created_user


@auth_router.get("/me", response_model=models.User)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Get User data"""
    return current_user
