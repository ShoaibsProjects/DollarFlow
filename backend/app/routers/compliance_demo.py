from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_database, get_current_user_id
from app.services.compliance_demo_service import DemoCompliancePolicyService, ComplianceAssessmentRequest
from app.schemas.compliance import ComplianceAssessmentResponse

router = APIRouter(prefix="/compliance-demo", tags=["Compliance Demo"])


async def get_compliance_service() -> DemoCompliancePolicyService:
    return DemoCompliancePolicyService()


@router.post("/assess", response_model=ComplianceAssessmentResponse)
async def assess_transfer(
    request: ComplianceAssessmentRequest,
    user_id: str = Depends(get_current_user_id),
    service: DemoCompliancePolicyService = Depends(get_compliance_service),
):
    return await service.assess(request)