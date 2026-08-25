from pydantic import BaseModel, Field
from typing import Literal, Dict, Any, Optional
from datetime import datetime


class ComplianceAssessmentRequest(BaseModel):
    sender_wallet: str
    recipient_wallet: str
    amount_atomic: str
    purpose: Optional[str] = None


class ComplianceAssessmentResponse(BaseModel):
    assessment_status: Literal["clear", "review", "blocked"]
    rules_evaluated: list[str]
    findings: Dict[str, Any]
    disclaimer: str = Field(
        default="Illustrative safety rules only. This is not KYC, AML, sanctions screening, legal advice, or a compliance determination.",
        description="Mandatory disclaimer"
    )
    disclaimer_version: str
    created_at: datetime


class ComplianceDemoAssessmentRecord(BaseModel):
    id: str
    intent_id: str
    assessment_status: Literal["clear", "review", "blocked"]
    rules_evaluated: list[str]
    findings: Dict[str, Any]
    disclaimer_version: str
    created_at: datetime