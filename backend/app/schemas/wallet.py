from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from app.utils.evm_addresses import is_valid_address


class WalletNonceRequest(BaseModel):
    wallet_address: str = Field(..., description="EVM wallet address to verify")
    
    @field_validator("wallet_address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        if not is_valid_address(v):
            raise ValueError("Invalid Ethereum address format")
        return v.lower()


class WalletNonceResponse(BaseModel):
    nonce: str = Field(..., description="Single-use nonce for signature")
    domain: str = Field(..., description="Domain for the signed message")
    chain_id: int = Field(..., description="Expected chain ID")
    issued_at: int = Field(..., description="Unix timestamp when nonce was issued")
    expires_at: int = Field(..., description="Unix timestamp when nonce expires")
    message_template: str = Field(..., description="Message template to sign")


class WalletVerifyRequest(BaseModel):
    wallet_address: str = Field(..., description="EVM wallet address")
    signature: str = Field(..., description="Signature of the message")
    message: str = Field(..., description="The exact message that was signed")
    
    @field_validator("wallet_address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        if not is_valid_address(v):
            raise ValueError("Invalid Ethereum address format")
        return v.lower()


class WalletVerifyResponse(BaseModel):
    success: bool = Field(..., description="Whether verification succeeded")
    wallet_address: str = Field(..., description="Verified wallet address")
    linked: bool = Field(..., description="Whether wallet was linked to user")
    message: str = Field(..., description="Human-readable result message")


class WalletLinkResponse(BaseModel):
    wallet_address: str
    label: Optional[str]
    status: Literal["active", "unlinked"]
    verified_at: Optional[str]
    is_default: bool


class WalletSelectRequest(BaseModel):
    wallet_address: str = Field(..., description="Wallet address to set as default")
    
    @field_validator("wallet_address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        if not is_valid_address(v):
            raise ValueError("Invalid Ethereum address format")
        return v.lower()


class WalletUnlinkRequest(BaseModel):
    wallet_address: str = Field(..., description="Wallet address to unlink")
    signature: str = Field(..., description="Signature proving ownership")
    message: str = Field(..., description="The exact message that was signed")
    
    @field_validator("wallet_address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        if not is_valid_address(v):
            raise ValueError("Invalid Ethereum address format")
        return v.lower()


class WalletUnlinkResponse(BaseModel):
    success: bool
    wallet_address: str
    message: str