from decimal import Decimal, InvalidOperation
from app.config import USDC_DECIMALS


class AmountError(ValueError):
    pass


def parse_usdc_to_atomic(amount_str: str) -> int:
    if not amount_str or not amount_str.strip():
        raise AmountError("Amount cannot be empty")
    try:
        decimal_value = Decimal(amount_str.strip())
    except (InvalidOperation, ValueError):
        raise AmountError("Invalid amount format")
    
    if decimal_value <= 0:
        raise AmountError("Amount must be positive")
    
    if decimal_value.as_tuple().exponent < -USDC_DECIMALS:
        raise AmountError(f"Too many decimal places (max {USDC_DECIMALS})")
    
    atomic = int(decimal_value * (10 ** USDC_DECIMALS))
    return atomic


def format_atomic_to_usdc(atomic: int) -> str:
    if atomic < 0:
        raise AmountError("Atomic amount cannot be negative")
    divisor = 10 ** USDC_DECIMALS
    whole = atomic // divisor
    fractional = atomic % divisor
    if fractional == 0:
        return f"{whole}.{'0' * USDC_DECIMALS}"
    fractional_str = str(fractional).zfill(USDC_DECIMALS)
    return f"{whole}.{fractional_str}"


def validate_atomic_amount(atomic: int, max_atomic: int = None) -> None:
    if atomic <= 0:
        raise AmountError("Amount must be positive")
    if max_atomic is not None and atomic > max_atomic:
        raise AmountError(f"Amount exceeds maximum allowed")


def validate_decimal_precision(amount_str: str) -> None:
    if "." in amount_str:
        decimals = len(amount_str.split(".")[1])
        if decimals > USDC_DECIMALS:
            raise AmountError(f"Too many decimal places (max {USDC_DECIMALS})")