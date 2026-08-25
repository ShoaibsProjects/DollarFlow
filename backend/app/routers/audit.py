from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

from app.dependencies import get_database, get_current_user_id
from app.services.audit_service import AuditService
from app.schemas.audit import AuditEventResponse, AuditEventsListResponse

router = APIRouter(prefix="/audit", tags=["Audit"])


async def get_audit_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> AuditService:
    return AuditService(db)


@router.get("/events", response_model=AuditEventsListResponse)
async def get_audit_events(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    service: AuditService = Depends(get_audit_service),
):
    events = await service.get_user_events(user_id, limit, skip)
    total = await service.audit_events.count_documents({"actor_user_id": user_id})
    
    return AuditEventsListResponse(
        events=[AuditEventResponse(**e) for e in events],
        total=total,
    )


@router.get("/events/{resource_type}/{resource_id}", response_model=List[AuditEventResponse])
async def get_audit_events_for_resource(
    resource_type: str,
    resource_id: str,
    user_id: str = Depends(get_current_user_id),
    service: AuditService = Depends(get_audit_service),
):
    events = await service.get_events_for_resource(user_id, resource_type, resource_id)
    return [AuditEventResponse(**e) for e in events]


@router.get("/verify-chain")
async def verify_audit_chain(
    user_id: str = Depends(get_current_user_id),
    service: AuditService = Depends(get_audit_service),
):
    is_valid = await service.verify_chain_integrity(user_id)
    return {"valid": is_valid}