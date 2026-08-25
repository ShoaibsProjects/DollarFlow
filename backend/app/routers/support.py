from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_database, get_current_user_id
from app.services.support_service import SupportService
from app.schemas.support import (
    SupportCaseCreate,
    SupportCaseComment,
    SupportCaseResponse,
    SupportCasesListResponse,
)

router = APIRouter(prefix="/support", tags=["Support"])


async def get_support_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> SupportService:
    return SupportService(db)


@router.post("/cases", response_model=SupportCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: SupportCaseCreate,
    user_id: str = Depends(get_current_user_id),
    service: SupportService = Depends(get_support_service),
):
    case = await service.create_case(
        user_id=user_id,
        transaction_intent_id=body.transaction_intent_id,
        case_type=body.type,
        category=body.category,
        description=body.description,
    )
    return SupportCaseResponse(**case)


@router.get("/cases", response_model=SupportCasesListResponse)
async def list_cases(
    limit: int = 50,
    skip: int = 0,
    user_id: str = Depends(get_current_user_id),
    service: SupportService = Depends(get_support_service),
):
    cases = await service.get_user_cases(user_id, limit, skip)
    total = await service.cases.count_documents({"user_id": user_id})
    return SupportCasesListResponse(
        cases=[SupportCaseResponse(**c) for c in cases],
        total=total,
    )


@router.get("/cases/{case_id}", response_model=SupportCaseResponse)
async def get_case(
    case_id: str,
    user_id: str = Depends(get_current_user_id),
    service: SupportService = Depends(get_support_service),
):
    case = await service.get_case(case_id, user_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return SupportCaseResponse(**case)


@router.post("/cases/{case_id}/comment", response_model=SupportCaseResponse)
async def add_comment(
    case_id: str,
    body: SupportCaseComment,
    user_id: str = Depends(get_current_user_id),
    service: SupportService = Depends(get_support_service),
):
    updated = await service.add_comment(case_id, user_id, body.content)
    if not updated:
        raise HTTPException(status_code=404, detail="Case not found")
    return SupportCaseResponse(**updated)