from fastapi import APIRouter, Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_database, get_current_user_id
from app.services.wallet_auth_service import WalletAuthService
from app.schemas.wallet import (
    WalletNonceRequest,
    WalletNonceResponse,
    WalletVerifyRequest,
    WalletVerifyResponse,
    WalletSelectRequest,
    WalletUnlinkRequest,
    WalletUnlinkResponse,
    WalletLinkResponse,
)

router = APIRouter(prefix="/wallet-auth", tags=["Wallet Authentication"])
limiter = Limiter(key_func=get_remote_address)


async def get_wallet_auth_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> WalletAuthService:
    return WalletAuthService(db)


@router.post("/nonce", response_model=WalletNonceResponse)
@limiter.limit("10/minute")
async def request_nonce(
    request: Request,
    body: WalletNonceRequest,
    user_id: str = Depends(get_current_user_id),
    service: WalletAuthService = Depends(get_wallet_auth_service),
):
    return await service.create_nonce(user_id, body.wallet_address)


@router.post("/verify", response_model=WalletVerifyResponse)
@limiter.limit("10/minute")
async def verify_signature(
    request: Request,
    body: WalletVerifyRequest,
    user_id: str = Depends(get_current_user_id),
    service: WalletAuthService = Depends(get_wallet_auth_service),
):
    return await service.verify_signature(
        user_id=user_id,
        wallet_address=body.wallet_address,
        signature=body.signature,
        message=body.message,
    )


@router.get("/me", response_model=list[WalletLinkResponse])
async def get_linked_wallets(
    user_id: str = Depends(get_current_user_id),
    service: WalletAuthService = Depends(get_wallet_auth_service),
):
    links = await service.get_user_wallets(user_id)
    return [
        WalletLinkResponse(
            wallet_address=link["wallet_address"],
            label=link.get("label"),
            status=link["status"],
            verified_at=link.get("verified_at"),
            is_default=False,
        )
        for link in links
    ]


@router.post("/select", response_model=WalletLinkResponse)
async def select_wallet(
    body: WalletSelectRequest,
    user_id: str = Depends(get_current_user_id),
    service: WalletAuthService = Depends(get_wallet_auth_service),
):
    success = await service.select_wallet(user_id, body.wallet_address)
    if not success:
        raise HTTPException(status_code=404, detail="Wallet not found or not active")
    
    link = await service.wallet_links.find_one({
        "user_id": user_id,
        "wallet_address": body.wallet_address,
    })
    return WalletLinkResponse(
        wallet_address=link["wallet_address"],
        label=link.get("label"),
        status=link["status"],
        verified_at=link.get("verified_at"),
        is_default=True,
    )


@router.post("/unlink", response_model=WalletUnlinkResponse)
@limiter.limit("5/minute")
async def unlink_wallet(
    request: Request,
    body: WalletUnlinkRequest,
    user_id: str = Depends(get_current_user_id),
    service: WalletAuthService = Depends(get_wallet_auth_service),
):
    success = await service.unlink_wallet(
        user_id=user_id,
        wallet_address=body.wallet_address,
        signature=body.signature,
        message=body.message,
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to unlink wallet. Verify signature and ownership.")
    
    return WalletUnlinkResponse(
        success=True,
        wallet_address=body.wallet_address,
        message="Wallet unlinked successfully",
    )