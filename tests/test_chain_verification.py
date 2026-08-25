import pytest
import pytest_asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.chain_verification_service import ChainVerificationService
from app.services.audit_service import AuditService
from app.utils.canonical_json import compute_event_hash, create_genesis_hash
from unittest.mock import AsyncMock, MagicMock, patch


@pytest_asyncio.fixture
async def chain_verification_service(db: AsyncIOMotorDatabase):
    return ChainVerificationService(db)


@pytest_asyncio.fixture
async def audit_service(db: AsyncIOMotorDatabase):
    return AuditService(db)


class TestChainVerification:
    @pytest.mark.asyncio
    async def test_exact_transfer_match_confirmed(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        # Insert a mock intent
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        # Mock the base_sepolia_client
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            # Mock receipt
            mock_receipt = {
                "status": 1,
                "blockNumber": 1234567,
                "logs": [
                    {
                        "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                        "topics": [
                            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                            "0x0000000000000000000000001234567890123456789012345678901234567890",
                            "0x0000000000000000000000000987654321098765432109876543210987654321",
                        ],
                        "data": "0x0000000000000000000000000000000000000000000000000000000001855040",  # 25500000 in hex
                    }
                ],
                "transactionHash": bytes.fromhex("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
                "chainId": 84532,
            }
            
            mock_client.get_transaction_receipt = AsyncMock(return_value=mock_receipt)
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            mock_client.parse_transfer_events = MagicMock(return_value=[
                {
                    "from": "0x1234567890123456789012345678901234567890",
                    "to": "0x0987654321098765432109876543210987654321",
                    "value": 25500000,
                    "block_number": 1234567,
                    "contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                }
            ])
            mock_client.find_matching_transfer = MagicMock(return_value={
                "from": "0x1234567890123456789012345678901234567890",
                "to": "0x0987654321098765432109876543210987654321",
                "value": 25500000,
                "block_number": 1234567,
                "contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            })
            
            result = await chain_verification_service.verify_transaction("intent_test123")
            
            assert result["verification_status"] == "matched"
            assert result["observed_chain_id"] == 84532
            assert result["observed_from"] == "0x1234567890123456789012345678901234567890"
            assert result["observed_to"] == "0x0987654321098765432109876543210987654321"
            assert result["observed_amount_atomic"] == "25500000"
            assert result["receipt_status"] == 1
            assert result["mismatch_reasons"] == []
            
            # Check intent status updated
            intent = await db["transaction_intents"].find_one({"id": "intent_test123"})
            assert intent["status"] == "CONFIRMED"
    
    @pytest.mark.asyncio
    async def test_failed_receipt_status_failed(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            mock_receipt = {
                "status": 0,  # failed
                "blockNumber": 1234567,
                "logs": [],
                "transactionHash": bytes.fromhex("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
                "chainId": 84532,
            }
            
            mock_client.get_transaction_receipt = AsyncMock(return_value=mock_receipt)
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            
            result = await chain_verification_service.verify_transaction("intent_test123")
            
            assert result["verification_status"] == "failed"
            assert "TRANSACTION_REVERTED" in result["mismatch_reasons"]
            
            intent = await db["transaction_intents"].find_one({"id": "intent_test123"})
            assert intent["status"] == "FAILED"
    
    @pytest.mark.asyncio
    async def test_wrong_token_mismatch(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            mock_receipt = {
                "status": 1,
                "blockNumber": 1234567,
                "logs": [
                    {
                        "address": "0xDifferentTokenContract",
                        "topics": [
                            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                            "0x0000000000000000000000001234567890123456789012345678901234567890",
                            "0x0000000000000000000000000987654321098765432109876543210987654321",
                        ],
                        "data": "0x0000000000000000000000000000000000000000000000000000000001855040",
                    }
                ],
                "transactionHash": bytes.fromhex("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
                "chainId": 84532,
            }
            
            mock_client.get_transaction_receipt = AsyncMock(return_value=mock_receipt)
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            mock_client.parse_transfer_events = MagicMock(return_value=[
                {
                    "from": "0x1234567890123456789012345678901234567890",
                    "to": "0x0987654321098765432109876543210987654321",
                    "value": 25500000,
                    "block_number": 1234567,
                    "contract": "0xDifferentTokenContract",
                }
            ])
            mock_client.find_matching_transfer = MagicMock(return_value=None)
            
            result = await chain_verification_service.verify_transaction("intent_test123")
            
            assert result["verification_status"] == "mismatch"
            assert "WRONG_TOKEN" in result["mismatch_reasons"]
            
            intent = await db["transaction_intents"].find_one({"id": "intent_test123"})
            assert intent["status"] == "EXCEPTION_MISMATCH"
    
    @pytest.mark.asyncio
    async def test_wrong_recipient_mismatch(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            mock_receipt = {
                "status": 1,
                "blockNumber": 1234567,
                "logs": [
                    {
                        "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                        "topics": [
                            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                            "0x0000000000000000000000001234567890123456789012345678901234567890",
                            "0x0000000000000000000000001111111111111111111111111111111111111111",  # wrong recipient
                        ],
                        "data": "0x0000000000000000000000000000000000000000000000000000000001855040",
                    }
                ],
                "transactionHash": bytes.fromhex("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
                "chainId": 84532,
            }
            
            mock_client.get_transaction_receipt = AsyncMock(return_value=mock_receipt)
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            mock_client.parse_transfer_events = MagicMock(return_value=[
                {
                    "from": "0x1234567890123456789012345678901234567890",
                    "to": "0x1111111111111111111111111111111111111111",  # wrong recipient
                    "value": 25500000,
                    "block_number": 1234567,
                    "contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                }
            ])
            mock_client.find_matching_transfer = MagicMock(return_value=None)
            
            result = await chain_verification_service.verify_transaction("intent_test123")
            
            assert result["verification_status"] == "mismatch"
            assert "WRONG_RECIPIENT" in result["mismatch_reasons"]
            
            intent = await db["transaction_intents"].find_one({"id": "intent_test123"})
            assert intent["status"] == "EXCEPTION_MISMATCH"
    
    @pytest.mark.asyncio
    async def test_wrong_amount_mismatch(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",  # 25.50 USDC
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            mock_receipt = {
                "status": 1,
                "blockNumber": 1234567,
                "logs": [
                    {
                        "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                        "topics": [
                            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                            "0x0000000000000000000000001234567890123456789012345678901234567890",
                            "0x0000000000000000000000000987654321098765432109876543210987654321",
                        ],
                        "data": "0x00000000000000000000000000000000000000000000000000000000000003E8",  # 1000 instead of 25500000
                    }
                ],
                "transactionHash": bytes.fromhex("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
                "chainId": 84532,
            }
            
            mock_client.get_transaction_receipt = AsyncMock(return_value=mock_receipt)
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            mock_client.parse_transfer_events = MagicMock(return_value=[
                {
                    "from": "0x1234567890123456789012345678901234567890",
                    "to": "0x0987654321098765432109876543210987654321",
                    "value": 1000,  # wrong amount
                    "block_number": 1234567,
                    "contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                }
            ])
            mock_client.find_matching_transfer = MagicMock(return_value=None)
            
            result = await chain_verification_service.verify_transaction("intent_test123")
            
            assert result["verification_status"] == "mismatch"
            assert "WRONG_AMOUNT" in result["mismatch_reasons"]
            
            intent = await db["transaction_intents"].find_one({"id": "intent_test123"})
            assert intent["status"] == "EXCEPTION_MISMATCH"
    
    @pytest.mark.asyncio
    async def test_wrong_sender_mismatch(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            mock_receipt = {
                "status": 1,
                "blockNumber": 1234567,
                "logs": [
                    {
                        "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                        "topics": [
                            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                            "0x0000000000000000000000001111111111111111111111111111111111111111",  # wrong sender
                            "0x0000000000000000000000000987654321098765432109876543210987654321",
                        ],
                        "data": "0x0000000000000000000000000000000000000000000000000000000001855040",
                    }
                ],
                "transactionHash": bytes.fromhex("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
                "chainId": 84532,
            }
            
            mock_client.get_transaction_receipt = AsyncMock(return_value=mock_receipt)
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            mock_client.parse_transfer_events = MagicMock(return_value=[
                {
                    "from": "0x1111111111111111111111111111111111111111",  # wrong sender
                    "to": "0x0987654321098765432109876543210987654321",
                    "value": 25500000,
                    "block_number": 1234567,
                    "contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                }
            ])
            mock_client.find_matching_transfer = MagicMock(return_value=None)
            
            result = await chain_verification_service.verify_transaction("intent_test123")
            
            assert result["verification_status"] == "mismatch"
            assert "WRONG_SENDER" in result["mismatch_reasons"]
            
            intent = await db["transaction_intents"].find_one({"id": "intent_test123"})
            assert intent["status"] == "EXCEPTION_MISMATCH"
    
    @pytest.mark.asyncio
    async def test_unknown_transaction_stays_confirming(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            mock_client.get_transaction_receipt = AsyncMock(return_value=None)  # not found
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            
            # Override the timeout for testing
            import app.services.chain_verification_service as cvs_module
            original_timeout = cvs_module.VERIFICATION_TIMEOUT
            cvs_module.VERIFICATION_TIMEOUT = 1  # 1 second timeout
            original_retries = cvs_module.MAX_VERIFICATION_RETRIES
            cvs_module.MAX_VERIFICATION_RETRIES = 2
            
            try:
                result = await chain_verification_service.verify_transaction("intent_test123")
                
                assert result["verification_status"] == "failed"
                assert "MAX_RETRIES_EXCEEDED" in result["mismatch_reasons"] or "VERIFICATION_TIMEOUT" in result["mismatch_reasons"]
            finally:
                cvs_module.VERIFICATION_TIMEOUT = original_timeout
                cvs_module.MAX_VERIFICATION_RETRIES = original_retries
    
    @pytest.mark.asyncio
    async def test_verification_idempotent(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            mock_receipt = {
                "status": 1,
                "blockNumber": 1234567,
                "logs": [
                    {
                        "address": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                        "topics": [
                            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                            "0x0000000000000000000000001234567890123456789012345678901234567890",
                            "0x0000000000000000000000000987654321098765432109876543210987654321",
                        ],
                        "data": "0x0000000000000000000000000000000000000000000000000000000001855040",
                    }
                ],
                "transactionHash": bytes.fromhex("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
                "chainId": 84532,
            }
            
            mock_client.get_transaction_receipt = AsyncMock(return_value=mock_receipt)
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            mock_client.parse_transfer_events = MagicMock(return_value=[
                {
                    "from": "0x1234567890123456789012345678901234567890",
                    "to": "0x0987654321098765432109876543210987654321",
                    "value": 25500000,
                    "block_number": 1234567,
                    "contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                }
            ])
            mock_client.find_matching_transfer = MagicMock(return_value={
                "from": "0x1234567890123456789012345678901234567890",
                "to": "0x0987654321098765432109876543210987654321",
                "value": 25500000,
                "block_number": 1234567,
                "contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            })
            
            result1 = await chain_verification_service.verify_transaction("intent_test123")
            assert result1["verification_status"] == "matched"
            
            # Second call should return cached result
            result2 = await chain_verification_service.verify_transaction("intent_test123")
            assert result2["verification_status"] == "matched"
            assert result2["verified_at"] == result1["verified_at"]
    
    @pytest.mark.asyncio
    async def test_frontend_hash_alone_never_causes_success(
        self, chain_verification_service: ChainVerificationService, db: AsyncIOMotorDatabase
    ):
        # Even if frontend submits a valid hash, backend must independently verify
        # This is enforced by the verification logic - status only becomes CONFIRMED
        # after all checks pass
        intent_doc = {
            "id": "intent_test123",
            "user_id": "user_test",
            "sender_wallet": "0x1234567890123456789012345678901234567890",
            "recipient_wallet": "0x0987654321098765432109876543210987654321",
            "amount_atomic": "25500000",
            "amount_display": "25.50",
            "token_symbol": "USDC",
            "token_contract": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            "token_decimals": 6,
            "chain_id": 84532,
            "status": "SUBMITTED",
            "transaction_hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "created_at": 1234567890,
        }
        await db["transaction_intents"].insert_one(intent_doc)
        
        # If receipt is missing or failed, status should not be CONFIRMED
        with patch("app.services.chain_verification_service.base_sepolia_client") as mock_client:
            mock_client.get_transaction_receipt = AsyncMock(return_value=None)
            mock_client.get_block_number = AsyncMock(return_value=1234570)
            
            import app.services.chain_verification_service as cvs_module
            original_retries = cvs_module.MAX_VERIFICATION_RETRIES
            cvs_module.MAX_VERIFICATION_RETRIES = 1
            
            try:
                result = await chain_verification_service.verify_transaction("intent_test123")
                assert result["verification_status"] == "failed"
                assert result["verification_status"] != "matched"
            finally:
                cvs_module.MAX_VERIFICATION_RETRIES = original_retries


class TestAuditIntegrity:
    @pytest.mark.asyncio
    async def test_audit_events_append_only(self, audit_service: AuditService, db: AsyncIOMotorDatabase):
        user_id = "user_test"
        
        # Emit multiple events
        for i in range(5):
            await audit_service.emit_event(
                user_id=user_id,
                event_type=f"TEST_EVENT_{i}",
                resource_type="test",
                resource_id=f"resource_{i}",
                payload={"index": i, "data": f"test_{i}"},
            )
        
        # Verify all events exist and are ordered
        events = await audit_service.get_user_events(user_id, limit=10)
        assert len(events) == 5
        
        # Events should be in reverse chronological order (newest first)
        for i in range(len(events) - 1):
            assert events[i]["created_at"] >= events[i + 1]["created_at"]
    
    @pytest.mark.asyncio
    async def test_audit_hash_chain_integrity(self, audit_service: AuditService, db: AsyncIOMotorDatabase):
        user_id = "user_test"
        
        await audit_service.emit_event(
            user_id=user_id,
            event_type="TEST_EVENT_1",
            resource_type="test",
            resource_id="resource_1",
            payload={"data": "first"},
        )
        await audit_service.emit_event(
            user_id=user_id,
            event_type="TEST_EVENT_2",
            resource_type="test",
            resource_id="resource_2",
            payload={"data": "second"},
        )
        
        # Verify chain integrity
        is_valid = await audit_service.verify_chain_integrity(user_id)
        assert is_valid is True
        
        # Tamper with an event
        await db["audit_events"].update_one(
            {"event_type": "TEST_EVENT_1"},
            {"$set": {"event_payload_json": {"data": "tampered"}}}
        )
        
        # Chain should now be invalid
        is_valid = await audit_service.verify_chain_integrity(user_id)
        assert is_valid is False
    
    @pytest.mark.asyncio
    async def test_audit_user_isolation(self, audit_service: AuditService, db: AsyncIOMotorDatabase):
        user_1 = "user_1"
        user_2 = "user_2"
        
        await audit_service.emit_event(
            user_id=user_1,
            event_type="TEST_EVENT",
            resource_type="test",
            resource_id="resource_1",
            payload={"owner": "user_1"},
        )
        await audit_service.emit_event(
            user_id=user_2,
            event_type="TEST_EVENT",
            resource_type="test",
            resource_id="resource_2",
            payload={"owner": "user_2"},
        )
        
        events_1 = await audit_service.get_user_events(user_1)
        events_2 = await audit_service.get_user_events(user_2)
        
        assert len(events_1) == 1
        assert len(events_2) == 1
        assert events_1[0]["actor_user_id"] == user_1
        assert events_2[0]["actor_user_id"] == user_2
        
        # User 1 cannot see user 2's events
        for event in events_1:
            assert event["actor_user_id"] == user_1
        for event in events_2:
            assert event["actor_user_id"] == user_2
    
    @pytest.mark.asyncio
    async def test_audit_resource_scoped_queries(self, audit_service: AuditService, db: AsyncIOMotorDatabase):
        user_id = "user_test"
        
        await audit_service.emit_event(
            user_id=user_id,
            event_type="EVENT_A",
            resource_type="transaction_intent",
            resource_id="intent_1",
            payload={},
        )
        await audit_service.emit_event(
            user_id=user_id,
            event_type="EVENT_B",
            resource_type="wallet_link",
            resource_id="wallet_1",
            payload={},
        )
        await audit_service.emit_event(
            user_id=user_id,
            event_type="EVENT_C",
            resource_type="transaction_intent",
            resource_id="intent_1",
            payload={},
        )
        
        intent_events = await audit_service.get_events_for_resource(
            user_id, "transaction_intent", "intent_1"
        )
        
        assert len(intent_events) == 2
        for event in intent_events:
            assert event["resource_type"] == "transaction_intent"
            assert event["resource_id"] == "intent_1"
    
    @pytest.mark.asyncio
    async def test_audit_no_secrets_in_payload(self, audit_service: AuditService, db: AsyncIOMotorDatabase):
        user_id = "user_test"
        
        await audit_service.emit_event(
            user_id=user_id,
            event_type="WALLET_LINKED",
            resource_type="wallet_link",
            resource_id="0x1234...5678",
            payload={
                "wallet_address": "0x1234567890123456789012345678901234567890",
                "chain_id": 84532,
            },
        )
        
        events = await audit_service.get_user_events(user_id)
        assert len(events) == 1
        
        payload = events[0]["event_payload_json"]
        # Should NOT contain private keys, seed phrases, session tokens
        assert "private_key" not in str(payload).lower()
        assert "seed" not in str(payload).lower()
        assert "mnemonic" not in str(payload).lower()
        assert "session_token" not in str(payload).lower()
        assert "recovery" not in str(payload).lower()
        
        # Should only contain safe data
        assert "wallet_address" in payload
        assert "chain_id" in payload