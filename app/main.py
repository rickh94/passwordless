from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.dependencies import db

app = FastAPI(title="Passwordless", version="19.8.1")


@app.on_event("startup")
async def setup_db():
    await db.users.create_index("username", unique=True)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*localhost.*",
    allow_methods=["*"],
    allow_headers=["*"],
)
