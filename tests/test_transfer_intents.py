import pytest
import pytest_asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.transfer_service import TransferService
from app.services.chain_verification_service import ChainVerificationService
from app.utils.amounts import parse_usdc_to_atomic, format_atomic_to_usdc, validate_atomic_amount, AmountError
from app.utils.evm_addresses import is_valid_address
from unittest.mock import AsyncMock, MagicMock, patch


@pytest_asyncio.fixture
async def transfer_service(db: AsyncIOMotorDatabase):
    return TransferService(db)


@pytest_asyncio.fixture
async def chain_verification_service(db: AsyncIOMotorDatabase):
    return ChainVerificationService(db)


class TestAmountHandling:
    def test_parse_usdc_to_atomic_valid(self):
        assert parse_usdc_to_atomic("25.50") == 25500000
        assert parse_usdc_to_atomic("1000.00") == 1000000000
        assert parse_usdc_to_atomic("0.01") == 10000
        assert parse_usdc_to_atomic("1") == 1000000
        assert parse_usdc_to_atomic("0.000001") == 1
    
    def test_parse_usdc_to_atomic_invalid(self):
        with pytest.raises(AmountError):
            parse_usdc_to_atomic("")
        with pytest.raises(AmountError):
            parse_usdc_to_atomic("invalid")
        with pytest.raises(AmountError):
            parse_usdc_to_atomic("-10.00")
        with pytest.raises(AmountError):
            parse_usdc_to_atomic("0")
        with pytest.raises(AmountError):
            parse_usdc_to_atomic("25.1234567")  # too many decimals
    
    def test_format_atomic_to_usdc(self):
        assert format_atomic_to_usdc(25500000) == "25.500000"
        assert format_atomic_to_usdc(1000000000) == "1000.000000"
        assert format_atomic_to_usdc(10000) == "0.010000"
        assert format_atomic_to_usdc(1000000) == "1.000000"
        assert format_atomic_to_usdc(1) == "0.000001"
        assert format_atomic_to_usdc(25000000) == "25.000000"
    
    def test_validate_atomic_amount(self):
        validate_atomic_amount(1000000, max_atomic=2000000)  # should pass
        with pytest.raises(AmountError):
            validate_atomic_amount(0)
        with pytest.raises(AmountError):
            validate_atomic_amount(-1)
        with pytest.raises(AmountError):
            validate_atomic_amount(3000000, max_atomic=2000000)


class TestTransferIntentIntegrity:
    @pytest.mark.asyncio
    async def test_create_intent_atomic_conversion(self, transfer_service: TransferService):
        user_id = "user_test"
        sender = "0x1234567890123456789012345678901234567890"
        recipient = "0x0987654321098765432109876543210987654321"
        amount = "25.50"
        client_request_id = "req_test123"
        
        result = await transfer_service.create_intent(
            user_id=user_id,
            sender_wallet=sender,
            recipient_wallet=recipient,
            amount_str=amount,
            purpose="Test transfer",
            client_request_id=client_request_id,
            risk_disclosure_version="v1.0",
        )
        
        assert result.amount_atomic == "25500000"
        assert result.amount_display == "25.500000"
        assert result.token_symbol == "USDC"
        assert result.token_decimals == 6
        assert result.chain_id == 84532
        assert result.status == "PENDING_SIGNATURE"
    
    @pytest.mark.asyncio
    async def test_create_intent_rejects_invalid_precision(self, transfer_service: TransferService):
        user_id = "user_test"
        sender = "0x1234567890123456789012345678901234567890"
        recipient = "0x0987654321098765432109876543210987654321"
        
        with pytest.raises(ValueError, match="Too many decimal places"):
            await transfer_service.create_intent(
                user_id=user_id,
                sender_wallet=sender,
                recipient_wallet=recipient,
                amount_str="25.1234567",
                purpose="Test",
                client_request_id="req_test",
                risk_disclosure_version="v1.0",
            )
    
    @pytest.mark.asyncio
    async def test_create_intent_rejects_negative_zero(self, transfer_service: TransferService):
        user_id = "user_test"
        sender = "0x1234567890123456789012345678901234567890"
        recipient = "0x0987654321098765432109876543210987654321"
        
        with pytest.raises(ValueError, match="Amount must be positive"):
            await transfer_service.create_intent(
                user_id=user_id,
                sender_wallet=sender,
                recipient_wallet=recipient,
                amount_str="-10.00",
                purpose="Test",
                client_request_id="req_test",
                risk_disclosure_version="v1.0",
            )
        
        with pytest.raises(ValueError, match="Amount must be positive"):
            await transfer_service.create_intent(
                user_id=user_id,
                sender_wallet=sender,
                recipient_wallet=recipient,
                amount_str="0",
                purpose="Test",
                client_request_id="req_test",
                risk_disclosure_version="v1.0",
            )
    
    @pytest.mark.asyncio
    async def test_create_intent_rejects_invalid_address(self, transfer_service: TransferService):
        user_id = "user_test"
        sender = "invalid"
        recipient = "0x0987654321098765432109876543210987654321"
        
        with pytest.raises(ValueError, match="Invalid Ethereum address"):
            await transfer_service.create_intent(
                user_id=user_id,
                sender_wallet=sender,
                recipient_wallet=recipient,
                amount_str="25.50",
                purpose="Test",
                client_request_id="req_test",
                risk_disclosure_version="v1.0",
            )
    
    @pytest.mark.asyncio
    async def test_create_intent_self_transfer_rejected(self, transfer_service: TransferService):
        user_id = "user_test"
        wallet = "0x1234567890123456789012345678901234567890"
        
        with pytest.raises(ValueError, match="Cannot send to self"):
            await transfer_service.create_intent(
                user_id=user_id,
                sender_wallet=wallet,
                recipient_wallet=wallet,
                amount_str="25.50",
                purpose="Test",
                client_request_id="req_test",
                risk_disclosure_version="v1.0",
            )
    
    @pytest.mark.asyncio
    async def test_idempotent_intent_creation(self, transfer_service: TransferService):
        user_id = "user_test"
        sender = "0x1234567890123456789012345678901234567890"
        recipient = "0x0987654321098765432109876543210987654321"
        client_request_id = "req_same123"
        
        result1 = await transfer_service.create_intent(
            user_id=user_id,
            sender_wallet=sender,
            recipient_wallet=recipient,
            amount_str="25.50",
            purpose="Test",
            client_request_id=client_request_id,
            risk_disclosure_version="v1.0",
        )
        
        result2 = await transfer_service.create_intent(
            user_id=user_id,
            sender_wallet=sender,
            recipient_wallet=recipient,
            amount_str="25.50",
            purpose="Test",
            client_request_id=client_request_id,
            risk_disclosure_version="v1.0",
        )
        
        assert result1.id == result2.id
        assert result1.client_request_id == client_request_id
    
    @pytest.mark.asyncio
    async def test_submit_hash_idempotent(self, transfer_service: TransferService):
        user_id = "user_test"
        sender = "0x1234567890123456789012345678901234567890"
        recipient = "0x0987654321098765432109876543210987654321"
        client_request_id = "req_submit123"
        
        intent = await transfer_service.create_intent(
            user_id=user_id,
            sender_wallet=sender,
            recipient_wallet=recipient,
            amount_str="25.50",
            purpose="Test",
            client_request_id=client_request_id,
            risk_disclosure_version="v1.0",
        )
        
        tx_hash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
        
        result1 = await transfer_service.submit_hash(intent.id, user_id, tx_hash)
        assert result1.transaction_hash == tx_hash.lower()
        assert result1.status == "SUBMITTED"
        
        # Submitting same hash again should be idempotent
        result2 = await transfer_service.submit_hash(intent.id, user_id, tx_hash)
        assert result2.transaction_hash == tx_hash.lower()
    
    @pytest.mark.asyncio
    async def test_submit_different_hash_rejected(self, transfer_service: TransferService):
        user_id = "user_test"
        sender = "0x1234567890123456789012345678901234567890"
        recipient = "0x0987654321098765432109876543210987654321"
        client_request_id = "req_diffhash123"
        
        intent = await transfer_service.create_intent(
            user_id=user_id,
            sender_wallet=sender,
            recipient_wallet=recipient,
            amount_str="25.50",
            purpose="Test",
            client_request_id=client_request_id,
            risk_disclosure_version="v1.0",
        )
        
        tx_hash1 = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
        tx_hash2 = "0x1111111111111111111111111111111111111111111111111111111111111111"
        
        await transfer_service.submit_hash(intent.id, user_id, tx_hash1)
        
        with pytest.raises(ValueError, match="already has a different transaction hash"):
            await transfer_service.submit_hash(intent.id, user_id, tx_hash2)
    
    @pytest.mark.asyncio
    async def test_cancel_intent_only_before_submit(self, transfer_service: TransferService):
        user_id = "user_test"
        sender = "0x1234567890123456789012345678901234567890"
        recipient = "0x0987654321098765432109876543210987654321"
        
        intent = await transfer_service.create_intent(
            user_id=user_id,
            sender_wallet=sender,
            recipient_wallet=recipient,
            amount_str="25.50",
            purpose="Test",
            client_request_id="req_cancel123",
            risk_disclosure_version="v1.0",
        )
        
        # Cancel before submit should work
        result = await transfer_service.cancel_intent(intent.id, user_id)
        assert result.status == "CANCELLED_BEFORE_SUBMISSION"
        
        # Create another intent and submit hash
        intent2 = await transfer_service.create_intent(
            user_id=user_id,
            sender_wallet=sender,
            recipient_wallet=recipient,
            amount_str="25.50",
            purpose="Test",
            client_request_id="req_cancel124",
            risk_disclosure_version="v1.0",
        )
        
        await transfer_service.submit_hash(intent2.id, user_id, "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890")
        
        # Cancel after submit should fail
        with pytest.raises(ValueError, match="Cannot cancel intent in status: SUBMITTED"):
            await transfer_service.cancel_intent(intent2.id, user_id)
    
    @pytest.mark.asyncio
    async def test_user_cannot_access_other_intent(self, transfer_service: TransferService):
        user_id_1 = "user_1"
        user_id_2 = "user_2"
        sender = "0x1234567890123456789012345678901234567890"
        recipient = "0x0987654321098765432109876543210987654321"
        
        intent = await transfer_service.create_intent(
            user_id=user_id_1,
            sender_wallet=sender,
            recipient_wallet=recipient,
            amount_str="25.50",
            purpose="Test",
            client_request_id="req_user1",
            risk_disclosure_version="v1.0",
        )
        
        # User 2 tries to access user 1's intent
        result = await transfer_service.get_intent(intent.id, user_id_2)
        assert result is None
        
        # User 2 tries to submit hash for user 1's intent
        with pytest.raises(ValueError, match="Intent not found"):
            await transfer_service.submit_hash(intent.id, user_id_2, "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890")


class TestChainVerification:
    @pytest.mark.asyncio
    async def test_exact_match_confirmed(self, chain_verification_service: ChainVerificationService):
        # This test requires mocking the base_sepolia_client
        # We'll test the logic by directly calling _finalize_verification
        pass  # Would need integration test with mocked RPC
    
    @pytest.mark.asyncio
    async def test_verification_idempotent(self, chain_verification_service: ChainVerificationService):
        # Verification should be idempotent - calling twice should return same result
        pass


class TestEVMAddressValidation:
    def test_valid_addresses(self):
        assert is_valid_address("0x1234567890123456789012345678901234567890")
        assert is_valid_address("0x0000000000000000000000000000000000000000")
        assert is_valid_address("0xABCDEFabcdef1234567890123456789012345678")
    
    def test_invalid_addresses(self):
        assert not is_valid_address("0x123")
        assert not is_valid_address("1234567890123456789012345678901234567890")
        assert not is_valid_address("")
        assert not is_valid_address(None)
        assert not is_valid_address("0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG")