from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    MONGO_URL: str = Field(default="mongodb://localhost:27017", description="MongoDB connection URL")
    DB_NAME: str = Field(default="dollarflow", description="Database name")
    CORS_ORIGINS: str = Field(default="http://localhost:3000", description="Comma-separated CORS origins")

    BASE_SEPOLIA_CHAIN_ID: int = Field(default=84532, description="Base Sepolia chain ID")
    BASE_SEPOLIA_RPC_URL: str = Field(
        default="https://sepolia.base.org",
        description="Base Sepolia public RPC URL (rate-limited, not for production)"
    )
    BASE_SEPOLIA_EXPLORER_URL: str = Field(
        default="https://sepolia.basescan.org",
        description="Base Sepolia block explorer base URL"
    )
    BASE_SEPOLIA_USDC_ADDRESS: str = Field(
        default="0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        description="Base Sepolia test USDC contract address"
    )
    BASE_SEPOLIA_USDC_DECIMALS: int = Field(default=6, description="USDC decimals")

    WALLET_AUTH_DOMAIN: str = Field(default="localhost:3000", description="Domain for wallet auth messages")
    WALLET_AUTH_NONCE_TTL_SECONDS: int = Field(default=300, description="Nonce time-to-live in seconds")
    TRANSACTION_INTENT_TTL_SECONDS: int = Field(default=900, description="Transaction intent time-to-live in seconds")
    DEMO_TRANSFER_CAP_USDC: str = Field(default="1000.00", description="Maximum demo transfer amount in USDC")

    AUDIT_HASH_SALT: str = Field(
        default="replace-with-local-dev-secret",
        description="Salt for audit event hashing (must be changed in production)"
    )
    DEMO_MODE: bool = Field(default=False, description="Enable demo mode with seeded data")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


USDC_CONTRACT_ADDRESS = settings.BASE_SEPOLIA_USDC_ADDRESS.lower()
USDC_DECIMALS = settings.BASE_SEPOLIA_USDC_DECIMALS
CHAIN_ID = settings.BASE_SEPOLIA_CHAIN_ID
RPC_URL = settings.BASE_SEPOLIA_RPC_URL
EXPLORER_URL = settings.BASE_SEPOLIA_EXPLORER_URL
EXPLORER_TX_URL = f"{EXPLORER_URL}/tx/{{tx_hash}}"
EXPLORER_ADDRESS_URL = f"{EXPLORER_URL}/address/{{address}}"

def _parse_cap_to_atomic(cap_str: str) -> int:
    if not cap_str:
        return 0
    parts = cap_str.split('.')
    whole = parts[0] if parts[0] else '0'
    fractional = parts[1] if len(parts) > 1 else ''
    if len(fractional) > 6:
        fractional = fractional[:6]
    fractional = fractional.ljust(6, '0')
    return int(whole) * 1_000_000 + int(fractional)


DEMO_TRANSFER_CAP_ATOMIC = _parse_cap_to_atomic(settings.DEMO_TRANSFER_CAP_USDC)