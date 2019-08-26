import logging
from typing import Optional

import bson

from app.auth import models
from app.dependencies import db

logger = logging.getLogger()


async def get_user_by_email(email: str) -> Optional[models.UserInDB]:
    user = await db.users.find_one({"email": email})
    if not user:
        return None
    return models.UserInDB.parse_obj(user)


async def create_user(user: models.UserInDB) -> models.UserInDB:
    result = await db.users.insert_one(
        user.dict(exclude={"password", "_id"}, skip_defaults=True)
    )
    created = await db.users.find_one({"_id": result.inserted_id})
    return models.UserInDB.parse_obj(created)


async def get_user_by_id(user_id: str) -> models.UserInDB:
    return await db.users.find_one({"_id": bson.ObjectId(user_id)})
