import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_db
client = TestClient(app)


def test_register_and_login():
    resp = client.post("/api/auth/register", json={
        "business_name": "Test Shop",
        "business_slug": "test-shop",
        "industry": "retail",
        "full_name": "Owner One",
        "email": "owner@testshop.com",
        "password": "secret123",
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert token

    resp2 = client.post("/api/auth/login", json={
        "email": "owner@testshop.com",
        "password": "secret123",
    })
    assert resp2.status_code == 200


def test_duplicate_email():
    client.post("/api/auth/register", json={
        "business_name": "Shop B",
        "business_slug": "shop-b",
        "full_name": "Owner B",
        "email": "dup@test.com",
        "password": "pass",
    })
    resp = client.post("/api/auth/register", json={
        "business_name": "Shop C",
        "business_slug": "shop-c",
        "full_name": "Owner C",
        "email": "dup@test.com",
        "password": "pass",
    })
    assert resp.status_code == 400
