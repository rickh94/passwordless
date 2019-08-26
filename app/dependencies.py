import os
from urllib.parse import quote_plus

from motor import motor_asyncio

DB_NAME = os.getenv("DB_NAME", "app")
db_uri = os.getenv("MONGODB_URI", False)
db = None

if db_uri:
    db_client = motor_asyncio.AsyncIOMotorClient(db_uri)
    db = db_client.get_database()
else:
    db_uri = "mongodb://{username}:{password}@{host}:{port}".format(
        username=quote_plus(os.getenv("DB_USERNAME", "root")),
        password=quote_plus(os.getenv("DB_PASSWORD", "root")),
        host=quote_plus(os.getenv("DB_HOST", "localhost")),
        port=quote_plus(os.getenv("DB_PORT", "27017")),
    )
    db_client = motor_asyncio.AsyncIOMotorClient(db_uri)
    db: motor_asyncio.AsyncIOMotorDatabase = db_client[DB_NAME]
