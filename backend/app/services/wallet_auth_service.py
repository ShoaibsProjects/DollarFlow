import secrets
import time
import hashlib
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from eth_account.messages import encode_defunct
from eth_account import Account

from app.config import settings
from app.utils.evm_addresses import to_checksum_address, normalize_address
from app.utils.canonical_json import compute_event_hash, create_genesis_hash
from app.schemas.wallet import WalletNonceResponse, WalletVerifyResponse


NONCE_COLLECTION = "wallet_auth_nonces"
WALLET_LINKS_COLLECTION = "wallet_links"
AUDIT_COLLECTION = "audit_events"


class WalletAuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.nonces = db[NONCE_COLLECTION]
        self.wallet_links = db[WALLET_LINKS_COLLECTION]
        self.audit_events = db[AUDIT_COLLECTION]

    async def create_nonce(self, user_id: str, wallet_address: str) -> WalletNonceResponse:
        wallet_address = normalize_address(wallet_address)
        domain = settings.WALLET_AUTH_DOMAIN
        chain_id = settings.BASE_SEPOLIA_CHAIN_ID
        issued_at = int(time.time())
        expires_at = issued_at + settings.WALLET_AUTH_NONCE_TTL_SECONDS
        
        nonce_bytes = secrets.token_bytes(32)
        nonce = nonce_bytes.hex()
        
        await self.nonces.insert_one({
            "nonce": nonce,
            "user_id": user_id,
            "wallet_address": wallet_address,
            "domain": domain,
            "chain_id": chain_id,
            "issued_at": issued_at,
            "expires_at": expires_at,
            "used_at": None,
            "attempt_count": 0,
            "status": "active",
            "created_at": issued_at,
        })
        
        message = self._build_message(
            domain=domain,
            address=wallet_address,
            chain_id=chain_id,
            nonce=nonce,
            issued_at=issued_at,
            expires_at=expires_at,
        )
        
        return WalletNonceResponse(
            nonce=nonce,
            domain=domain,
            chain_id=chain_id,
            issued_at=issued_at,
            expires_at=expires_at,
            message_template=message,
        )

    def _build_message(
        self,
        domain: str,
        address: str,
        chain_id: int,
        nonce: str,
        issued_at: int,
        expires_at: int,
    ) -> str:
        return (
            f"DollarFlow Wallet Verification\n"
            f"Domain: {domain}\n"
            f"Address: {address}\n"
            f"Chain ID: {chain_id}\n"
            f"Nonce: {nonce}\n"
            f"Issued At: {issued_at}\n"
            f"Expires At: {expires_at}\n"
            f"Statement: Signing this message proves ownership of this wallet address. "
            f"This is NOT a blockchain transaction and will NOT move any funds.\n"
            f"Terms Version: v1.0"
        )

    async def verify_signature(
        self,
        user_id: str,
        wallet_address: str,
        signature: str,
        message: str,
    ) -> WalletVerifyResponse:
        wallet_address = normalize_address(wallet_address)
        
        nonce_pattern = f"^{message.split('Nonce: ')[1].split(chr(10))[0]}$"
        nonce_doc = await self.nonces.find_one({
            "nonce": {"$regex": nonce_pattern},
            "user_id": user_id,
            "wallet_address": wallet_address,
            "status": "active",
        })
        
        if not nonce_doc:
            return WalletVerifyResponse(
                success=False,
                wallet_address=wallet_address,
                linked=False,
                message="Invalid or expired nonce",
            )
        
        if nonce_doc["attempt_count"] >= 3:
            await self.nonces.update_one(
                {"_id": nonce_doc["_id"]},
                {"$set": {"status": "invalidated"}}
            )
            return WalletVerifyResponse(
                success=False,
                wallet_address=wallet_address,
                linked=False,
                message="Too many verification attempts",
            )
        
        if time.time() > nonce_doc["expires_at"]:
            await self.nonces.update_one(
                {"_id": nonce_doc["_id"]},
                {"$set": {"status": "expired"}}
            )
            return WalletVerifyResponse(
                success=False,
                wallet_address=wallet_address,
                linked=False,
                message="Nonce has expired",
            )
        
        expected_message = self._build_message(
            domain=nonce_doc["domain"],
            address=nonce_doc["wallet_address"],
            chain_id=nonce_doc["chain_id"],
            nonce=nonce_doc["nonce"],
            issued_at=nonce_doc["issued_at"],
            expires_at=nonce_doc["expires_at"],
        )
        
        if message.strip() != expected_message.strip():
            await self.nonces.update_one(
                {"_id": nonce_doc["_id"]},
                {"$inc": {"attempt_count": 1}}
            )
            return WalletVerifyResponse(
                success=False,
                wallet_address=wallet_address,
                linked=False,
                message="Message does not match expected format",
            )
        
        try:
            encoded = encode_defunct(text=message)
            recovered = Account.recover_message(encoded, signature=signature)
            recovered_normalized = normalize_address(recovered)
            
            if recovered_normalized != wallet_address:
                await self.nonces.update_one(
                    {"_id": nonce_doc["_id"]},
                    {"$inc": {"attempt_count": 1}}
                )
                return WalletVerifyResponse(
                    success=False,
                    wallet_address=wallet_address,
                    linked=False,
                    message="Signature does not match wallet address",
                )
        except Exception as e:
            await self.nonces.update_one(
                {"_id": nonce_doc["_id"]},
                {"$inc": {"attempt_count": 1}}
            )
            return WalletVerifyResponse(
                success=False,
                wallet_address=wallet_address,
                linked=False,
                message=f"Invalid signature: {str(e)}",
            )
        
        await self.nonces.update_one(
            {"_id": nonce_doc["_id"]},
            {"$set": {"status": "used", "used_at": int(time.time())}}
        )
        
        existing_link = await self.wallet_links.find_one({
            "user_id": user_id,
            "wallet_address": wallet_address,
        })
        
        now = int(time.time())
        if existing_link:
            await self.wallet_links.update_one(
                {"_id": existing_link["_id"]},
                {"$set": {
                    "status": "active",
                    "verified_at": now,
                    "last_seen_at": now,
                    "updated_at": now,
                }}
            )
        else:
            await self.wallet_links.insert_one({
                "user_id": user_id,
                "wallet_address": wallet_address,
                "chain_id": settings.BASE_SEPOLIA_CHAIN_ID,
                "label": None,
                "status": "active",
                "verified_at": now,
                "last_seen_at": now,
                "created_at": now,
                "updated_at": now,
            })
        
        await self._emit_audit_event(
            user_id=user_id,
            event_type="WALLET_LINKED",
            resource_type="wallet_link",
            resource_id=wallet_address,
            event_payload={
                "wallet_address": wallet_address,
                "chain_id": settings.BASE_SEPOLIA_CHAIN_ID,
            },
        )
        
        return WalletVerifyResponse(
            success=True,
            wallet_address=wallet_address,
            linked=True,
            message="Wallet verified and linked successfully",
        )

    async def get_user_wallets(self, user_id: str) -> list[Dict[str, Any]]:
        links = await self.wallet_links.find({
            "user_id": user_id,
            "status": "active",
        }).to_list(20)
        return links

    async def select_wallet(self, user_id: str, wallet_address: str) -> bool:
        wallet_address = normalize_address(wallet_address)
        result = await self.wallet_links.update_one(
            {"user_id": user_id, "wallet_address": wallet_address, "status": "active"},
            {"$set": {"last_seen_at": int(time.time()), "updated_at": int(time.time())}}
        )
        return result.modified_count > 0

    async def unlink_wallet(
        self,
        user_id: str,
        wallet_address: str,
        signature: str,
        message: str,
    ) -> bool:
        wallet_address = normalize_address(wallet_address)
        
        link = await self.wallet_links.find_one({
            "user_id": user_id,
            "wallet_address": wallet_address,
            "status": "active",
        })
        
        if not link:
            return False
        
        encoded = encode_defunct(text=message)
        try:
            recovered = Account.recover_message(encoded, signature=signature)
            if normalize_address(recovered) != wallet_address:
                return False
        except Exception:
            return False
        
        await self.wallet_links.update_one(
            {"_id": link["_id"]},
            {"$set": {"status": "unlinked", "updated_at": int(time.time())}}
        )
        
        await self._emit_audit_event(
            user_id=user_id,
            event_type="WALLET_UNLINKED",
            resource_type="wallet_link",
            resource_id=wallet_address,
            event_payload={
                "wallet_address": wallet_address,
            },
        )
        
        return True

    async def _emit_audit_event(
        self,
        user_id: str,
        event_type: str,
        resource_type: str,
        resource_id: str,
        event_payload: Dict[str, Any],
    ):
        prev_hash = await self._get_last_event_hash()
        event_hash = compute_event_hash(prev_hash, event_payload)
        
        await self.audit_events.insert_one({
            "actor_user_id": user_id,
            "event_type": event_type,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "event_payload_json": event_payload,
            "previous_event_hash": prev_hash,
            "event_hash": event_hash,
            "ip_hash": None,
            "user_agent_hash": None,
            "created_at": int(time.time()),
        })

    async def _get_last_event_hash(self) -> str:
        last = await self.audit_events.find_one(
            sort=[("created_at", -1)]
        )
        if last:
            return last["event_hash"]
        return create_genesis_hash()