from typing import AsyncGenerator, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClient
from fastapi import Depends, HTTPException, Request
from app.config import get_settings, settings


_mongo_client: Optional[AsyncIOMotorClient] = None


async def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(settings.MONGO_URL)
    return _mongo_client


async def get_database() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    client = await get_mongo_client()
    db = client[settings.DB_NAME]
    try:
        yield db
    finally:
        pass


async def close_mongo_client():
    global _mongo_client
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None


async def get_current_user_id(request: Request) -> str:
    from server import get_current_user
    user = await get_current_user(request)
    return user["user_id"]


async def get_current_user_optional(request: Request) -> Optional[dict]:
    from server import get_current_user
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def get_rate_limit_user_id(request: Request) -> Optional[str]:
    """Get user_id for rate limiting if authenticated, otherwise None."""
    try:
        from server import get_current_user
        user = await get_current_user(request)
        return user.get("user_id") if user else None
    except HTTPException:
        return None