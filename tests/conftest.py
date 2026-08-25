import pytest
import pytest_asyncio
import asyncio
import os
import sys

# Set PYTEST_CURRENT_TEST before importing server so CSRF secure flag works in tests
os.environ['PYTEST_CURRENT_TEST'] = '1'

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
from httpx import ASGITransport, AsyncClient
from server import app


@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def mongo_client():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    yield client
    client.close()


@pytest_asyncio.fixture(scope="function")
async def db(mongo_client):
    db = mongo_client[settings.DB_NAME]
    # Clear all collections before each test
    collections = await db.list_collection_names()
    for coll in collections:
        if not coll.startswith("system."):
            await db[coll].delete_many({})
    yield db
    # Cleanup after test
    for coll in collections:
        if not coll.startswith("system."):
            await db[coll].delete_many({})


@pytest_asyncio.fixture(scope="function")
async def async_client(mongo_client):
    """Create an async HTTP client for testing the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client