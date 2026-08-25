import time
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.utils.canonical_json import compute_event_hash, create_genesis_hash


AUDIT_COLLECTION = "audit_events"


class AuditService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.audit_events = db[AUDIT_COLLECTION]

    async def emit_event(
        self,
        user_id: str,
        event_type: str,
        resource_type: str,
        resource_id: str,
        payload: Dict[str, Any],
        ip_hash: Optional[str] = None,
        user_agent_hash: Optional[str] = None,
    ) -> Dict[str, Any]:
        prev_hash = await self._get_last_event_hash()
        event_hash = compute_event_hash(prev_hash, payload)
        
        now = int(time.time())
        event_doc = {
            "id": f"audit_{event_hash[:12]}",
            "actor_user_id": user_id,
            "event_type": event_type,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "event_payload_json": payload,
            "previous_event_hash": prev_hash,
            "event_hash": event_hash,
            "ip_hash": ip_hash,
            "user_agent_hash": user_agent_hash,
            "created_at": now,
        }
        
        await self.audit_events.insert_one(event_doc)
        return event_doc

    async def _get_last_event_hash(self) -> str:
        last = await self.audit_events.find_one(sort=[("created_at", -1)])
        if last:
            return last["event_hash"]
        return create_genesis_hash()

    async def get_user_events(
        self,
        user_id: str,
        limit: int = 50,
        skip: int = 0,
    ) -> List[Dict[str, Any]]:
        cursor = self.audit_events.find({"actor_user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(limit)

    async def get_events_for_resource(
        self,
        user_id: str,
        resource_type: str,
        resource_id: str,
    ) -> List[Dict[str, Any]]:
        cursor = self.audit_events.find({
            "actor_user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
        }).sort("created_at", -1)
        return await cursor.to_list(100)

    async def verify_chain_integrity(self, user_id: Optional[str] = None) -> bool:
        query = {}
        if user_id:
            query["actor_user_id"] = user_id
        
        events = await self.audit_events.find(query).sort("created_at", 1).to_list(10000)
        
        if not events:
            return True
        
        prev_hash = create_genesis_hash()
        for event in events:
            payload = event.get("event_payload_json", {})
            expected_hash = compute_event_hash(prev_hash, payload)
            if event.get("event_hash") != expected_hash:
                return False
            prev_hash = expected_hash
        
        return True