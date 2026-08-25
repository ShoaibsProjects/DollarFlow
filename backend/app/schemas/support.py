from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime


class SupportCaseCreate(BaseModel):
    transaction_intent_id: Optional[str] = Field(default=None, description="Optional related transaction")
    type: Literal["support", "complaint", "suspicious_activity_report"] = Field(..., description="Case type")
    category: Literal[
        "transfer_pending",
        "wrong_recipient",
        "wallet_issue",
        "bug",
        "safety",
        "other"
    ] = Field(..., description="Case category")
    description: str = Field(..., min_length=1, max_length=5000, description="Case description")


class SupportCaseComment(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Comment content")


class SupportCaseResponse(BaseModel):
    id: str
    user_id: str
    transaction_intent_id: Optional[str]
    type: Literal["support", "complaint", "suspicious_activity_report"]
    category: Literal[
        "transfer_pending",
        "wrong_recipient",
        "wallet_issue",
        "bug",
        "safety",
        "other"
    ]
    description: str
    status: Literal["open", "in_review", "resolved", "closed"]
    priority: Literal["low", "normal", "high"]
    assigned_to: Optional[str]
    resolution_note: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]


class SupportCasesListResponse(BaseModel):
    cases: List[SupportCaseResponse]
    total: int