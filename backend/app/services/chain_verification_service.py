import asyncio
import time
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import (
    settings,
    CHAIN_ID,
    USDC_CONTRACT_ADDRESS,
    USDC_DECIMALS,
)
from app.blockchain.base_sepolia_client import base_sepolia_client
from app.utils.evm_addresses import normalize_address
from app.utils.canonical_json import compute_event_hash, create_genesis_hash
from app.services.audit_service import AuditService


VERIFICATIONS_COLLECTION = "chain_verifications"
INTENTS_COLLECTION = "transaction_intents"
AUDIT_COLLECTION = "audit_events"

MAX_VERIFICATION_RETRIES = 10
VERIFICATION_RETRY_DELAY = 5
VERIFICATION_TIMEOUT = 300


class ChainVerificationService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.verifications = db[VERIFICATIONS_COLLECTION]
        self.intents = db[INTENTS_COLLECTION]
        self.audit_events = db[AUDIT_COLLECTION]
        self.audit_service = AuditService(db)

    async def verify_transaction(self, intent_id: str) -> Dict[str, Any]:
        intent = await self.intents.find_one({"id": intent_id})
        if not intent:
            raise ValueError("Intent not found")
        
        tx_hash = intent.get("transaction_hash")
        if not tx_hash:
            raise ValueError("No transaction hash to verify")
        
        existing = await self.verifications.find_one({"intent_id": intent_id})
        if existing and existing["verification_status"] in ["matched", "mismatch", "failed"]:
            return existing
        
        verification_doc = {
            "id": f"verify_{intent_id}",
            "intent_id": intent_id,
            "transaction_hash": tx_hash,
            "verification_status": "pending",
            "observed_chain_id": None,
            "observed_block_number": None,
            "observed_from": None,
            "observed_to": None,
            "observed_amount_atomic": None,
            "observed_token_contract": None,
            "receipt_status": None,
            "confirmations_observed": 0,
            "raw_receipt_redacted": None,
            "mismatch_reasons": [],
            "verified_at": None,
            "created_at": int(time.time()),
        }
        
        if existing:
            await self.verifications.update_one(
                {"intent_id": intent_id},
                {"$set": verification_doc}
            )
        else:
            await self.verifications.insert_one(verification_doc)
        
        start_time = time.time()
        for attempt in range(MAX_VERIFICATION_RETRIES):
            if time.time() - start_time > VERIFICATION_TIMEOUT:
                await self._finalize_verification(
                    intent_id=intent_id,
                    intent=intent,
                    status="failed",
                    mismatch_reasons=["VERIFICATION_TIMEOUT"],
                )
                return await self.verifications.find_one({"intent_id": intent_id})
            
            try:
                receipt = await base_sepolia_client.get_transaction_receipt(tx_hash)
            except Exception as e:
                await asyncio.sleep(VERIFICATION_RETRY_DELAY)
                continue
            
            if receipt is None:
                await asyncio.sleep(VERIFICATION_RETRY_DELAY)
                continue
            
            receipt_status = receipt.get("status", 0)
            block_number = receipt.get("blockNumber", 0)
            
            if receipt_status == 0:
                await self._finalize_verification(
                    intent_id=intent_id,
                    intent=intent,
                    status="failed",
                    receipt_status=receipt_status,
                    block_number=block_number,
                    mismatch_reasons=["TRANSACTION_REVERTED"],
                )
                return await self.verifications.find_one({"intent_id": intent_id})
            
            events = base_sepolia_client.parse_transfer_events(receipt)
            
            expected_from = normalize_address(intent["sender_wallet"])
            expected_to = normalize_address(intent["recipient_wallet"])
            expected_amount = int(intent["amount_atomic"])
            expected_contract = USDC_CONTRACT_ADDRESS.lower()
            
            matching_event = base_sepolia_client.find_matching_transfer(
                events,
                expected_from,
                expected_to,
                expected_amount,
            )
            
            mismatch_reasons = []
            if not events:
                mismatch_reasons.append("MISSING_TRANSFER_EVENT")
            elif not matching_event:
                for event in events:
                    if event.get("value") != expected_amount:
                        mismatch_reasons.append("WRONG_AMOUNT")
                    if normalize_address(event.get("from", "")) != expected_from:
                        mismatch_reasons.append("WRONG_SENDER")
                    if normalize_address(event.get("to", "")) != expected_to:
                        mismatch_reasons.append("WRONG_RECIPIENT")
                    if event.get("contract", "").lower() != expected_contract:
                        mismatch_reasons.append("WRONG_TOKEN")
                if not mismatch_reasons:
                    mismatch_reasons.append("MISSING_TRANSFER_EVENT")
            
            current_block = await base_sepolia_client.get_block_number()
            confirmations = max(0, current_block - block_number + 1)
            
            redacted_receipt = self._redact_receipt(receipt)
            
            if not mismatch_reasons and matching_event:
                await self._finalize_verification(
                    intent_id=intent_id,
                    intent=intent,
                    status="matched",
                    receipt_status=receipt_status,
                    block_number=block_number,
                    observed_from=matching_event["from"],
                    observed_to=matching_event["to"],
                    observed_amount=matching_event["value"],
                    observed_contract=matching_event.get("contract", USDC_CONTRACT_ADDRESS),
                    confirmations=confirmations,
                    raw_receipt=redacted_receipt,
                )
            else:
                await self._finalize_verification(
                    intent_id=intent_id,
                    intent=intent,
                    status="mismatch",
                    receipt_status=receipt_status,
                    block_number=block_number,
                    mismatch_reasons=mismatch_reasons,
                    confirmations=confirmations,
                    raw_receipt=redacted_receipt,
                )
            
            return await self.verifications.find_one({"intent_id": intent_id})
        
        await self._finalize_verification(
            intent_id=intent_id,
            intent=intent,
            status="failed",
            mismatch_reasons=["MAX_RETRIES_EXCEEDED"],
        )
        return await self.verifications.find_one({"intent_id": intent_id})

    async def _finalize_verification(
        self,
        intent_id: str,
        intent: Dict[str, Any],
        status: str,
        receipt_status: Optional[int] = None,
        block_number: Optional[int] = None,
        observed_from: Optional[str] = None,
        observed_to: Optional[str] = None,
        observed_amount: Optional[int] = None,
        observed_contract: Optional[str] = None,
        confirmations: int = 0,
        raw_receipt: Optional[Dict[str, Any]] = None,
        mismatch_reasons: Optional[List[str]] = None,
    ):
        now = int(time.time())
        
        verification_update = {
            "verification_status": status,
            "verified_at": now,
        }
        
        if receipt_status is not None:
            verification_update["receipt_status"] = receipt_status
        if block_number is not None:
            verification_update["observed_block_number"] = block_number
            verification_update["observed_chain_id"] = CHAIN_ID
        if observed_from:
            verification_update["observed_from"] = observed_from
        if observed_to:
            verification_update["observed_to"] = observed_to
        if observed_amount is not None:
            verification_update["observed_amount_atomic"] = str(observed_amount)
        if observed_contract:
            verification_update["observed_token_contract"] = observed_contract
        if confirmations:
            verification_update["confirmations_observed"] = confirmations
        if raw_receipt:
            verification_update["raw_receipt_redacted"] = raw_receipt
        if mismatch_reasons:
            verification_update["mismatch_reasons"] = mismatch_reasons
        
        await self.verifications.update_one(
            {"intent_id": intent_id},
            {"$set": verification_update}
        )
        
        intent_status_map = {
            "matched": "CONFIRMED",
            "mismatch": "EXCEPTION_MISMATCH",
            "failed": "FAILED",
            "not_found": "FAILED",
        }
        
        new_intent_status = intent_status_map.get(status, "FAILED")
        await self.intents.update_one(
            {"id": intent_id},
            {"$set": {
                "status": new_intent_status,
                "confirmed_at": now if new_intent_status == "CONFIRMED" else None,
                "failure_code": mismatch_reasons[0] if mismatch_reasons else ("REVERTED" if status == "failed" else None),
                "failure_reason": ", ".join(mismatch_reasons) if mismatch_reasons else ("Transaction reverted on chain" if status == "failed" else None),
            }}
        )
        
        event_type_map = {
            "matched": "CHAIN_TRANSFER_CONFIRMED",
            "mismatch": "CHAIN_TRANSFER_MISMATCH",
            "failed": "CHAIN_TRANSFER_FAILED",
        }
        
        await self.audit_service.emit_event(
            user_id=intent["user_id"],
            event_type=event_type_map.get(status, "CHAIN_TRANSFER_FAILED"),
            resource_type="transaction_intent",
            resource_id=intent_id,
            payload={
                "intent_id": intent_id,
                "transaction_hash": intent.get("transaction_hash"),
                "verification_status": status,
                "receipt_status": receipt_status,
                "block_number": block_number,
                "confirmations": confirmations,
                "mismatch_reasons": mismatch_reasons or [],
                "observed": {
                    "from": observed_from,
                    "to": observed_to,
                    "amount": str(observed_amount) if observed_amount else None,
                    "contract": observed_contract,
                },
                "expected": {
                    "from": intent["sender_wallet"],
                    "to": intent["recipient_wallet"],
                    "amount": intent["amount_atomic"],
                    "contract": USDC_CONTRACT_ADDRESS,
                },
            },
        )

    def _redact_receipt(self, receipt: Dict[str, Any]) -> Dict[str, Any]:
        safe_keys = [
            "transactionHash", "blockNumber", "status", "gasUsed", "effectiveGasPrice",
            "cumulativeGasUsed", "logsBloom", "type", "chainId",
        ]
        redacted = {k: v for k, v in receipt.items() if k in safe_keys}
        if "transactionHash" in redacted:
            redacted["transactionHash"] = redacted["transactionHash"].hex() if hasattr(redacted["transactionHash"], "hex") else str(redacted["transactionHash"])
        return redacted

    async def get_verification(self, intent_id: str) -> Optional[Dict[str, Any]]:
        return await self.verifications.find_one({"intent_id": intent_id})

    async def get_usdc_balance(self, wallet: str) -> Dict[str, Any]:
        wallet = normalize_address(wallet)
        try:
            balance_atomic = await base_sepolia_client.get_usdc_balance(wallet)
            balance_display = base_sepolia_client.format_atomic_to_decimal(balance_atomic)
            rpc_available = True
        except Exception as e:
            balance_atomic = 0
            balance_display = "0.000000"
            rpc_available = False
        
        return {
            "wallet": wallet,
            "balance_atomic": str(balance_atomic),
            "balance_display": balance_display,
            "token_symbol": "USDC",
            "token_contract": USDC_CONTRACT_ADDRESS,
            "token_decimals": USDC_DECIMALS,
            "chain_id": CHAIN_ID,
            "timestamp": int(time.time()),
            "rpc_available": rpc_available,
        }