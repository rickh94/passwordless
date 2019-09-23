import os
import secrets

import pytest
from _pytest.monkeypatch import MonkeyPatch
from starlette.testclient import TestClient


@pytest.fixture
def user_data():
    return {"email": "test@rickhenry.dev", "full_name": "Test Person"}


@pytest.fixture
def user1(db, user_data):
    result = db.users.insert_one(user_data)
    return {**user_data, "id": result.inserted_id}


def test_register(
    test_client: TestClient, user_data: dict, monkeypatch: MonkeyPatch, async_db, db
):
    """Test creating a new user"""
    monkeypatch.setattr("app.auth.crud.db", async_db)
    response = test_client.post("/auth/register", json=user_data)

    assert response.status_code == 201
    user_in_db = db.users.find_one({"email": user_data["email"]})

    assert user_in_db["full_name"] == user_data["full_name"]


def test_request_login(
    test_client: TestClient, user1: dict, monkeypatch: MonkeyPatch, async_db
):
    """Test request login sends email"""
    monkeypatch.setattr("app.auth.crud.db", async_db)
    monkeypatch.setattr(secrets, "choice", lambda args: "1")

    async def fake_send_email(to, subject, text):
        assert to == "test@rickhenry.dev"
        assert subject == "Your One Time Password"
        assert text == "Your password is 11111111"

    monkeypatch.setattr("app.auth.router.send_email", fake_send_email)
    response = test_client.post("/auth/request", json={"email": user1["email"]})
    assert response.status_code == 200
    assert response.text == '"Please check your email for a single use password."'


def test_request_magic_link(
    test_client: TestClient, user1: dict, monkeypatch: MonkeyPatch, async_db
):
    monkeypatch.setattr("app.auth.crud.db", async_db)
    monkeypatch.setattr(secrets, "token_urlsafe", lambda: "123456789")
    hostname = os.getenv("HOSTNAME", "localhost")

    async def fake_send_email(to, subject, text):
        assert to == "test@rickhenry.dev"
        assert subject == "Your magic sign in link"
        assert text == f"Click this link to sign in\n{hostname}?secret=123456789"

    monkeypatch.setattr("app.auth.router.send_email", fake_send_email)
    response = test_client.post("/auth/request-magic", json={"email": user1["email"]})

    assert response.status_code == 200
    assert response.text == '"Please check your email for your sign in link."'
