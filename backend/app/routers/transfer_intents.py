from fastapi import APIRouter, Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_database, get_current_user_id
from app.services.transfer_service import TransferService
from app.schemas.transaction import (
    TransactionIntentCreate,
    TransactionIntentSubmit,
    TransactionIntentCancel,
    TransactionIntentResponse,
    TransactionIntentListResponse,
    ChainConfigResponse,
)

router = APIRouter(prefix="/transaction-intents", tags=["Transaction Intents"])
limiter = Limiter(key_func=get_remote_address)


async def get_transfer_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> TransferService:
    return TransferService(db)


@router.post("", response_model=TransactionIntentResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_intent(
    request: Request,
    body: TransactionIntentCreate,
    user_id: str = Depends(get_current_user_id),
    service: TransferService = Depends(get_transfer_service),
):
    try:
        return await service.create_intent(
            user_id=user_id,
            sender_wallet=body.selected_sender_wallet,
            recipient_wallet=body.recipient_wallet,
            amount_str=body.amount,
            purpose=body.purpose,
            client_request_id=body.client_request_id,
            risk_disclosure_version=body.risk_disclosure_version,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=TransactionIntentListResponse)
async def list_intents(
    limit: int = 50,
    skip: int = 0,
    user_id: str = Depends(get_current_user_id),
    service: TransferService = Depends(get_transfer_service),
):
    return await service.list_intents(user_id, limit, skip)


@router.get("/{intent_id}", response_model=TransactionIntentResponse)
async def get_intent(
    intent_id: str,
    user_id: str = Depends(get_current_user_id),
    service: TransferService = Depends(get_transfer_service),
):
    intent = await service.get_intent(intent_id, user_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    return intent


@router.post("/{intent_id}/submit", response_model=TransactionIntentResponse)
@limiter.limit("30/minute")
async def submit_hash(
    request: Request,
    intent_id: str,
    body: TransactionIntentSubmit,
    user_id: str = Depends(get_current_user_id),
    service: TransferService = Depends(get_transfer_service),
):
    try:
        return await service.submit_hash(intent_id, user_id, body.transaction_hash)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{intent_id}/cancel", response_model=TransactionIntentResponse)
async def cancel_intent(
    intent_id: str,
    body: TransactionIntentCancel,
    user_id: str = Depends(get_current_user_id),
    service: TransferService = Depends(get_transfer_service),
):
    try:
        return await service.cancel_intent(intent_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{intent_id}/verify", response_model=TransactionIntentResponse)
@limiter.limit("10/minute")
async def trigger_verification(
    request: Request,
    intent_id: str,
    user_id: str = Depends(get_current_user_id),
    service: TransferService = Depends(get_transfer_service),
):
    try:
        return await service.trigger_verification(intent_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/config/chain", response_model=ChainConfigResponse)
async def get_chain_config(
    service: TransferService = Depends(get_transfer_service),
):
    return service.get_chain_config()