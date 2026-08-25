from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorDatabase

from .wallet_auth import router as wallet_auth_router
from .transfer_intents import router as transfer_intents_router
from .blockchain import router as blockchain_router
from .audit import router as audit_router
from .compliance_demo import router as compliance_demo_router
from .support import router as support_router


def register_v1_routers(app: FastAPI, db: AsyncIOMotorDatabase):
    app.include_router(wallet_auth_router, prefix="/api")
    app.include_router(transfer_intents_router, prefix="/api")
    app.include_router(blockchain_router, prefix="/api")
    app.include_router(audit_router, prefix="/api")
    app.include_router(compliance_demo_router, prefix="/api")
    app.include_router(support_router, prefix="/api")