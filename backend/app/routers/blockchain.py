from fastapi import APIRouter, Depends, HTTPException, Request, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_database, get_current_user_id
from app.services.chain_verification_service import ChainVerificationService
from app.schemas.blockchain import USDCBalanceResponse

router = APIRouter(prefix="/blockchain", tags=["Blockchain"])
limiter = Limiter(key_func=get_remote_address)


async def get_chain_verification_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> ChainVerificationService:
    return ChainVerificationService(db)


@router.get("/usdc-balance", response_model=USDCBalanceResponse)
@limiter.limit("30/minute")
async def get_usdc_balance(
    request: Request,
    wallet: str = Query(..., description="EVM wallet address"),
    user_id: str = Depends(get_current_user_id),
    service: ChainVerificationService = Depends(get_chain_verification_service),
):
    from app.utils.evm_addresses import is_valid_address
    if not is_valid_address(wallet):
        raise HTTPException(status_code=400, detail="Invalid wallet address")
    
    return await service.get_usdc_balance(wallet)


# Test endpoint for security middleware validation (no auth required)
@router.post("/test-security")
@limiter.limit("10/minute")
async def test_security_endpoint(request: Request):
    """Test endpoint for validating security middleware (CSRF, Origin/Referer, rate limiting).
    No authentication required - used for automated security testing."""
    return {"status": "ok", "message": "Security middleware validation successful"}