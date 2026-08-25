import re
from eth_utils import to_checksum_address as eth_to_checksum
from eth_utils import is_address as eth_is_address


EVM_ADDRESS_REGEX = re.compile(r"^0x[a-fA-F0-9]{40}$")


def is_valid_address(address: str) -> bool:
    if not isinstance(address, str):
        return False
    if not EVM_ADDRESS_REGEX.match(address):
        return False
    try:
        return eth_is_address(address)
    except Exception:
        return False


def to_checksum_address(address: str) -> str:
    if not is_valid_address(address):
        raise ValueError(f"Invalid Ethereum address: {address}")
    return eth_to_checksum(address)


def normalize_address(address: str) -> str:
    if not is_valid_address(address):
        raise ValueError(f"Invalid Ethereum address: {address}")
    return address.lower()


def addresses_match(addr1: str, addr2: str) -> bool:
    try:
        return normalize_address(addr1) == normalize_address(addr2)
    except Exception:
        return False


def is_same_address(addr1: str, addr2: str) -> bool:
    return addresses_match(addr1, addr2)