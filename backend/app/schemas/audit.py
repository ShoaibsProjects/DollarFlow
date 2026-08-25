from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class AuditEventCreate(BaseModel):
    event_type: str = Field(..., description="Type of event (e.g., TRANSFER_INTENT_CREATED)")
    resource_type: str = Field(..., description="Resource type (e.g., transaction_intent)")
    resource_id: str = Field(..., description="Resource identifier")
    event_payload: Dict[str, Any] = Field(..., description="Event data")
    ip_hash: Optional[str] = Field(default=None, description="Hashed IP address")
    user_agent_hash: Optional[str] = Field(default=None, description="Hashed user agent")


class AuditEventResponse(BaseModel):
    id: str
    actor_user_id: str
    event_type: str
    resource_type: str
    resource_id: str
    event_payload_json: Dict[str, Any]
    previous_event_hash: str
    event_hash: str
    ip_hash: Optional[str]
    user_agent_hash: Optional[str]
    created_at: datetime


class AuditEventsListResponse(BaseModel):
    events: list[AuditEventResponse]
    total: int