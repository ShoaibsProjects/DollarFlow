from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from datetime import datetime


class ChainVerificationResult(BaseModel):
    verification_status: Literal["pending", "matched", "mismatch", "failed", "not_found"]
    observed_chain_id: Optional[int]
    observed_block_number: Optional[int]
    observed_from: Optional[str]
    observed_to: Optional[str]
    observed_amount_atomic: Optional[str]
    observed_token_contract: Optional[str]
    receipt_status: Optional[int]
    confirmations_observed: int
    mismatch_reasons: List[str]
    verified_at: Optional[datetime]


class ChainVerificationRecord(BaseModel):
    id: str
    intent_id: str
    transaction_hash: str
    verification_status: Literal["pending", "matched", "mismatch", "failed", "not_found"]
    observed_chain_id: Optional[int]
    observed_block_number: Optional[int]
    observed_from: Optional[str]
    observed_to: Optional[str]
    observed_amount_atomic: Optional[str]
    observed_token_contract: Optional[str]
    receipt_status: Optional[int]
    confirmations_observed: int
    raw_receipt_redacted: Optional[Dict[str, Any]]
    mismatch_reasons: List[str]
    verified_at: Optional[datetime]
    created_at: datetime


class USDCBalanceResponse(BaseModel):
    wallet: str
    balance_atomic: str
    balance_display: str
    token_symbol: str
    token_contract: str
    token_decimals: int
    chain_id: int
    timestamp: datetime
    rpc_available: bool