from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.config import settings, DEMO_TRANSFER_CAP_ATOMIC
from app.utils.evm_addresses import is_valid_address, normalize_address


class ComplianceAssessmentRequest(BaseModel):
    sender_wallet: str
    recipient_wallet: str
    amount_atomic: str
    purpose: Optional[str] = None


class ComplianceAssessmentResponse(BaseModel):
    assessment_status: str = Field(..., description="clear | review | blocked")
    rules_evaluated: List[str]
    findings: Dict[str, Any]
    disclaimer: str
    disclaimer_version: str
    created_at: datetime


class DemoCompliancePolicyService:
    DISCLAIMER = (
        "Illustrative safety rules only. This is not KYC, AML, sanctions screening, "
        "legal advice, or a compliance determination."
    )
    DISCLAIMER_VERSION = "v1.0-demo"

    def __init__(self):
        self.demo_blocked_wallets = set()
        self.demo_review_wallets = set()
        if settings.DEMO_MODE:
            self._seed_demo_addresses()

    def _seed_demo_addresses(self):
        self.demo_blocked_wallets = {
            "0x000000000000000000000000000000000000dead",
            "0x000000000000000000000000000000000000badd",  # valid hex
        }
        self.demo_review_wallets = {
            "0x000000000000000000000000000000000000deaf",  # valid hex
            "0x000000000000000000000000000000000000cafe",  # valid hex
        }

    def _is_demo_address(self, address: str) -> bool:
        return address.lower() in self.demo_blocked_wallets or address.lower() in self.demo_review_wallets

    async def assess(self, request: ComplianceAssessmentRequest) -> ComplianceAssessmentResponse:
        rules_evaluated = []
        findings = {}

        # Parse amount first (needed for multiple checks)
        try:
            amount_atomic = int(request.amount_atomic)
        except (ValueError, TypeError):
            amount_atomic = 0

        demo_cap_atomic = DEMO_TRANSFER_CAP_ATOMIC

        # Check address validity BEFORE normalizing
        if not is_valid_address(request.sender_wallet):
            rules_evaluated.append("address_format_sender")
            findings["sender_wallet"] = "invalid_format"
            return ComplianceAssessmentResponse(
                assessment_status="blocked",
                rules_evaluated=rules_evaluated,
                findings=findings,
                disclaimer=self.DISCLAIMER,
                disclaimer_version=self.DISCLAIMER_VERSION,
                created_at=datetime.now(),
            )

        if not is_valid_address(request.recipient_wallet):
            rules_evaluated.append("address_format_recipient")
            findings["recipient_wallet"] = "invalid_format"
            return ComplianceAssessmentResponse(
                assessment_status="blocked",
                rules_evaluated=rules_evaluated,
                findings=findings,
                disclaimer=self.DISCLAIMER,
                disclaimer_version=self.DISCLAIMER_VERSION,
                created_at=datetime.now(),
            )

        sender = normalize_address(request.sender_wallet)
        recipient = normalize_address(request.recipient_wallet)

        rules_evaluated.append("address_format")
        findings["address_format"] = "valid"

        if recipient in self.demo_blocked_wallets:
            rules_evaluated.append("demo_blocked_recipient")
            findings["recipient_wallet"] = "demo_blocked"
            return ComplianceAssessmentResponse(
                assessment_status="blocked",
                rules_evaluated=rules_evaluated,
                findings=findings,
                disclaimer=self.DISCLAIMER,
                disclaimer_version=self.DISCLAIMER_VERSION,
                created_at=datetime.now(),
            )

        if recipient in self.demo_review_wallets:
            rules_evaluated.append("demo_review_recipient")
            findings["recipient_wallet"] = "demo_review"
            return ComplianceAssessmentResponse(
                assessment_status="review",
                rules_evaluated=rules_evaluated,
                findings=findings,
                disclaimer=self.DISCLAIMER,
                disclaimer_version=self.DISCLAIMER_VERSION,
                created_at=datetime.now(),
            )

        if amount_atomic > demo_cap_atomic:
            rules_evaluated.append("demo_transfer_cap")
            findings["amount_atomic"] = str(amount_atomic)
            findings["cap_atomic"] = str(demo_cap_atomic)
            return ComplianceAssessmentResponse(
                assessment_status="review",
                rules_evaluated=rules_evaluated,
                findings=findings,
                disclaimer=self.DISCLAIMER,
                disclaimer_version=self.DISCLAIMER_VERSION,
                created_at=datetime.now(),
            )

        rules_evaluated.append("demo_transfer_cap")
        findings["amount_atomic"] = str(amount_atomic)
        findings["cap_atomic"] = str(demo_cap_atomic)
        findings["within_cap"] = True

        if not request.purpose or not request.purpose.strip():
            rules_evaluated.append("transfer_purpose")
            findings["purpose"] = "missing"
            return ComplianceAssessmentResponse(
                assessment_status="review",
                rules_evaluated=rules_evaluated,
                findings=findings,
                disclaimer=self.DISCLAIMER,
                disclaimer_version=self.DISCLAIMER_VERSION,
                created_at=datetime.now(),
            )

        rules_evaluated.append("transfer_purpose")
        findings["purpose"] = "provided"

        return ComplianceAssessmentResponse(
            assessment_status="clear",
            rules_evaluated=rules_evaluated,
            findings=findings,
            disclaimer=self.DISCLAIMER,
            disclaimer_version=self.DISCLAIMER_VERSION,
            created_at=datetime.now(),
        )