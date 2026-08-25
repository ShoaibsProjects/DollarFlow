import uuid
import time
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from decimal import Decimal

from app.config import (
    settings,
    CHAIN_ID,
    USDC_CONTRACT_ADDRESS,
    USDC_DECIMALS,
    DEMO_TRANSFER_CAP_ATOMIC,
    EXPLORER_TX_URL,
)
from app.utils.evm_addresses import normalize_address, is_valid_address
from app.utils.amounts import parse_usdc_to_atomic, format_atomic_to_usdc, validate_atomic_amount, AmountError
from app.utils.canonical_json import compute_event_hash, create_genesis_hash
from app.schemas.transaction import (
    TransactionIntentCreate,
    TransactionIntentSubmit,
    TransactionIntentResponse,
    TransactionIntentListResponse,
    ChainConfigResponse,
)
from app.schemas.compliance import ComplianceAssessmentRequest
from app.services.compliance_demo_service import DemoCompliancePolicyService
from app.services.audit_service import AuditService


INTENTS_COLLECTION = "transaction_intents"
AUDIT_COLLECTION = "audit_events"
COMPLIANCE_COLLECTION = "compliance_demo_assessments"


class TransferService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.intents = db[INTENTS_COLLECTION]
        self.audit_events = db[AUDIT_COLLECTION]
        self.compliance = db[COMPLIANCE_COLLECTION]
        self.compliance_service = DemoCompliancePolicyService()
        self.audit_service = AuditService(db)

    async def create_intent(
        self,
        user_id: str,
        sender_wallet: str,
        recipient_wallet: str,
        amount_str: str,
        purpose: Optional[str],
        client_request_id: str,
        risk_disclosure_version: str,
    ) -> TransactionIntentResponse:
        sender_wallet = normalize_address(sender_wallet)
        recipient_wallet = normalize_address(recipient_wallet)
        
        if sender_wallet == recipient_wallet:
            raise ValueError("Cannot send to self")
        
        if not is_valid_address(sender_wallet) or not is_valid_address(recipient_wallet):
            raise ValueError("Invalid wallet address")
        
        existing = await self.intents.find_one({
            "user_id": user_id,
            "client_request_id": client_request_id,
        })
        if existing:
            return self._intent_to_response(existing)
        
        try:
            amount_atomic = parse_usdc_to_atomic(amount_str)
            validate_atomic_amount(amount_atomic, DEMO_TRANSFER_CAP_ATOMIC)
        except AmountError as e:
            raise ValueError(str(e))
        
        amount_display = format_atomic_to_usdc(amount_atomic)
        
        policy_request = ComplianceAssessmentRequest(
            sender_wallet=sender_wallet,
            recipient_wallet=recipient_wallet,
            amount_atomic=str(amount_atomic),
            purpose=purpose,
        )
        policy_result = await self.compliance_service.assess(policy_request)
        
        now = int(time.time())
        expires_at = now + settings.TRANSACTION_INTENT_TTL_SECONDS
        
        intent_doc = {
            "id": f"intent_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "client_request_id": client_request_id,
            "sender_wallet": sender_wallet,
            "recipient_wallet": recipient_wallet,
            "amount_atomic": str(amount_atomic),
            "amount_display": amount_display,
            "token_symbol": "USDC",
            "token_contract": USDC_CONTRACT_ADDRESS,
            "token_decimals": USDC_DECIMALS,
            "chain_id": CHAIN_ID,
            "status": "PENDING_SIGNATURE",
            "risk_disclosure_version": risk_disclosure_version,
            "risk_disclosure_accepted_at": str(now),
            "policy_result": policy_result.model_dump(),
            "created_at": now,
            "submitted_at": None,
            "confirmed_at": None,
            "expires_at": expires_at,
            "transaction_hash": None,
            "failure_code": None,
            "failure_reason": None,
            "metadata": {
                "purpose": purpose,
            },
        }
        
        await self.intents.insert_one(intent_doc)
        
        await self.audit_service.emit_event(
            user_id=user_id,
            event_type="TRANSFER_INTENT_CREATED",
            resource_type="transaction_intent",
            resource_id=intent_doc["id"],
            payload={
                "intent_id": intent_doc["id"],
                "sender_wallet": sender_wallet,
                "recipient_wallet": recipient_wallet,
                "amount_atomic": str(amount_atomic),
                "amount_display": amount_display,
                "policy_result": policy_result.model_dump(),
            },
        )
        
        if policy_result.assessment_status != "clear":
            await self.compliance.insert_one({
                "id": f"compliance_{uuid.uuid4().hex[:12]}",
                "intent_id": intent_doc["id"],
                "assessment_status": policy_result.assessment_status,
                "rules_evaluated": policy_result.rules_evaluated,
                "findings": policy_result.findings,
                "disclaimer_version": policy_result.disclaimer_version,
                "created_at": now,
            })
        
        return self._intent_to_response(intent_doc)

    async def submit_hash(
        self,
        intent_id: str,
        user_id: str,
        tx_hash: str,
    ) -> TransactionIntentResponse:
        tx_hash = tx_hash.lower()
        
        intent = await self.intents.find_one({"id": intent_id, "user_id": user_id})
        if not intent:
            raise ValueError("Intent not found")
        
        if intent["status"] in ["CONFIRMED", "FAILED", "EXCEPTION_MISMATCH", "EXPIRED", "CANCELLED_BEFORE_SUBMISSION"]:
            raise ValueError(f"Intent cannot be modified in status: {intent['status']}")
        
        if intent["transaction_hash"] and intent["transaction_hash"] != tx_hash:
            raise ValueError("Intent already has a different transaction hash")
        
        now = int(time.time())
        if now > intent["expires_at"]:
            await self.intents.update_one(
                {"id": intent_id},
                {"$set": {"status": "EXPIRED"}}
            )
            raise ValueError("Intent has expired")
        
        await self.intents.update_one(
            {"id": intent_id},
            {"$set": {
                "transaction_hash": tx_hash,
                "status": "SUBMITTED",
                "submitted_at": now,
            }}
        )
        
        await self.audit_service.emit_event(
            user_id=user_id,
            event_type="TRANSFER_SUBMITTED",
            resource_type="transaction_intent",
            resource_id=intent_id,
            payload={
                "intent_id": intent_id,
                "transaction_hash": tx_hash,
            },
        )
        
        updated = await self.intents.find_one({"id": intent_id})
        return self._intent_to_response(updated)

    async def cancel_intent(
        self,
        intent_id: str,
        user_id: str,
    ) -> TransactionIntentResponse:
        intent = await self.intents.find_one({"id": intent_id, "user_id": user_id})
        if not intent:
            raise ValueError("Intent not found")
        
        if intent["status"] != "PENDING_SIGNATURE":
            raise ValueError(f"Cannot cancel intent in status: {intent['status']}")
        
        await self.intents.update_one(
            {"id": intent_id},
            {"$set": {"status": "CANCELLED_BEFORE_SUBMISSION"}}
        )
        
        await self.audit_service.emit_event(
            user_id=user_id,
            event_type="TRANSFER_CANCELLED",
            resource_type="transaction_intent",
            resource_id=intent_id,
            payload={"intent_id": intent_id},
        )
        
        updated = await self.intents.find_one({"id": intent_id})
        return self._intent_to_response(updated)

    async def get_intent(self, intent_id: str, user_id: str) -> Optional[TransactionIntentResponse]:
        intent = await self.intents.find_one({"id": intent_id, "user_id": user_id})
        if not intent:
            return None
        return self._intent_to_response(intent)

    async def list_intents(
        self,
        user_id: str,
        limit: int = 50,
        skip: int = 0,
    ) -> TransactionIntentListResponse:
        cursor = self.intents.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        intents = await cursor.to_list(limit)
        total = await self.intents.count_documents({"user_id": user_id})
        
        return TransactionIntentListResponse(
            intents=[self._intent_to_response(i) for i in intents],
            total=total,
        )

    async def trigger_verification(self, intent_id: str, user_id: str) -> TransactionIntentResponse:
        intent = await self.intents.find_one({"id": intent_id, "user_id": user_id})
        if not intent:
            raise ValueError("Intent not found")
        
        if intent["status"] not in ["SUBMITTED", "CONFIRMING"]:
            raise ValueError(f"Cannot verify intent in status: {intent['status']}")
        
        if not intent.get("transaction_hash"):
            raise ValueError("No transaction hash submitted")
        
        await self.intents.update_one(
            {"id": intent_id},
            {"$set": {"status": "CONFIRMING"}}
        )
        
        from app.services.chain_verification_service import ChainVerificationService
        verification_service = ChainVerificationService(self.db)
        await verification_service.verify_transaction(intent_id)
        
        updated = await self.intents.find_one({"id": intent_id})
        return self._intent_to_response(updated)

    def get_chain_config(self) -> ChainConfigResponse:
        return ChainConfigResponse(
            chain_id=CHAIN_ID,
            rpc_url=settings.BASE_SEPOLIA_RPC_URL,
            explorer_url=settings.BASE_SEPOLIA_EXPLORER_URL,
            usdc_address=USDC_CONTRACT_ADDRESS,
            usdc_decimals=USDC_DECIMALS,
            usdc_symbol="USDC",
        )

    def _intent_to_response(self, doc: Dict[str, Any]) -> TransactionIntentResponse:
        return TransactionIntentResponse(
            id=doc["id"],
            user_id=doc["user_id"],
            client_request_id=doc["client_request_id"],
            sender_wallet=doc["sender_wallet"],
            recipient_wallet=doc["recipient_wallet"],
            amount_atomic=doc["amount_atomic"],
            amount_display=doc["amount_display"],
            token_symbol=doc["token_symbol"],
            token_contract=doc["token_contract"],
            token_decimals=doc["token_decimals"],
            chain_id=doc["chain_id"],
            status=doc["status"],
            risk_disclosure_version=doc["risk_disclosure_version"],
            risk_disclosure_accepted_at=doc.get("risk_disclosure_accepted_at"),
            policy_result=doc.get("policy_result"),
            created_at=doc["created_at"],
            submitted_at=doc.get("submitted_at"),
            confirmed_at=doc.get("confirmed_at"),
            expires_at=doc["expires_at"],
            transaction_hash=doc.get("transaction_hash"),
            failure_code=doc.get("failure_code"),
            failure_reason=doc.get("failure_reason"),
            metadata=doc.get("metadata", {}),
        )