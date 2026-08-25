import pytest
import pytest_asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings


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