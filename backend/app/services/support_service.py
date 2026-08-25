import uuid
import time
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.audit_service import AuditService


SUPPORT_COLLECTION = "support_cases"
AUDIT_COLLECTION = "audit_events"


class SupportService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.cases = db[SUPPORT_COLLECTION]
        self.audit_service = AuditService(db)

    async def create_case(
        self,
        user_id: str,
        transaction_intent_id: Optional[str],
        case_type: str,
        category: str,
        description: str,
    ) -> Dict[str, Any]:
        now = int(time.time())
        case_doc = {
            "id": f"case_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "transaction_intent_id": transaction_intent_id,
            "type": case_type,
            "category": category,
            "description": description,
            "status": "open",
            "priority": "normal",
            "assigned_to": None,
            "resolution_note": None,
            "created_at": now,
            "updated_at": now,
            "resolved_at": None,
        }
        
        await self.cases.insert_one(case_doc)
        
        await self.audit_service.emit_event(
            user_id=user_id,
            event_type="SUPPORT_CASE_CREATED",
            resource_type="support_case",
            resource_id=case_doc["id"],
            payload={
                "case_id": case_doc["id"],
                "type": case_type,
                "category": category,
                "transaction_intent_id": transaction_intent_id,
            },
        )
        
        return case_doc

    async def get_user_cases(self, user_id: str, limit: int = 50, skip: int = 0) -> List[Dict[str, Any]]:
        cursor = self.cases.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(limit)

    async def get_case(self, case_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.cases.find_one({"id": case_id, "user_id": user_id})

    async def add_comment(
        self,
        case_id: str,
        user_id: str,
        content: str,
    ) -> Optional[Dict[str, Any]]:
        case = await self.cases.find_one({"id": case_id, "user_id": user_id})
        if not case:
            return None
        
        now = int(time.time())
        comment = {
            "id": f"comment_{uuid.uuid4().hex[:8]}",
            "content": content,
            "author_user_id": user_id,
            "created_at": now,
        }
        
        await self.cases.update_one(
            {"id": case_id},
            {"$push": {"comments": comment}, "$set": {"updated_at": now}}
        )
        
        await self.audit_service.emit_event(
            user_id=user_id,
            event_type="SUPPORT_CASE_COMMENT",
            resource_type="support_case",
            resource_id=case_id,
            payload={"comment_id": comment["id"]},
        )
        
        updated = await self.cases.find_one({"id": case_id})
        return updated

    async def update_case_status(
        self,
        case_id: str,
        user_id: str,
        status: str,
        resolution_note: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        case = await self.cases.find_one({"id": case_id, "user_id": user_id})
        if not case:
            return None
        
        now = int(time.time())
        update = {"status": status, "updated_at": now}
        if resolution_note:
            update["resolution_note"] = resolution_note
        if status in ["resolved", "closed"]:
            update["resolved_at"] = now
        
        await self.cases.update_one({"id": case_id}, {"$set": update})
        
        await self.audit_service.emit_event(
            user_id=user_id,
            event_type="SUPPORT_CASE_UPDATED",
            resource_type="support_case",
            resource_id=case_id,
            payload={"new_status": status, "resolution_note": resolution_note},
        )
        
        return await self.cases.find_one({"id": case_id})