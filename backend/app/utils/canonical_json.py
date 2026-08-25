import json
import hashlib
from typing import Any, Dict, Optional
from datetime import datetime


class CanonicalJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def canonical_json(data: Any) -> str:
    return json.dumps(
        data,
        separators=(",", ":"),
        sort_keys=True,
        ensure_ascii=True,
        cls=CanonicalJSONEncoder,
    )


def compute_event_hash(previous_hash: str, payload: Dict[str, Any]) -> str:
    canonical_payload = canonical_json(payload)
    combined = previous_hash + canonical_payload
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def verify_event_chain(events: list) -> bool:
    if not events:
        return True
    prev_hash = "0" * 64
    for event in events:
        payload = event.get("event_payload_json", {})
        expected_hash = compute_event_hash(prev_hash, payload)
        if event.get("event_hash") != expected_hash:
            return False
        prev_hash = expected_hash
    return True


def create_genesis_hash() -> str:
    return "0" * 64