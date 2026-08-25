import asyncio
import logging
from typing import Optional, Dict, Any, List
from web3 import Web3
from web3.types import TxReceipt, LogReceipt
from web3.exceptions import TransactionNotFound, BlockNotFound

from app.config import (
    RPC_URL,
    CHAIN_ID,
    USDC_CONTRACT_ADDRESS,
    USDC_DECIMALS,
)
from app.blockchain.erc20_abi import ERC20_ABI
from app.utils.evm_addresses import to_checksum_address, is_valid_address

logger = logging.getLogger(__name__)


class BaseSepoliaClient:
    def __init__(self, rpc_url: str = RPC_URL, request_timeout: int = 30, max_retries: int = 3):
        self.rpc_url = rpc_url
        self.request_timeout = request_timeout
        self.max_retries = max_retries
        self._w3: Optional[Web3] = None
        self._usdc_contract = None

    @property
    def w3(self) -> Web3:
        if self._w3 is None:
            self._w3 = Web3(
                Web3.HTTPProvider(
                    self.rpc_url,
                    request_kwargs={"timeout": self.request_timeout}
                )
            )
            self._usdc_contract = self._w3.eth.contract(
                address=USDC_CONTRACT_ADDRESS,
                abi=ERC20_ABI
            )
        return self._w3

    @property
    def usdc_contract(self):
        if self._usdc_contract is None:
            _ = self.w3
        return self._usdc_contract

    async def _run_with_retry(self, func, *args, **kwargs):
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                return await asyncio.get_event_loop().run_in_executor(None, func, *args, **kwargs)
            except (TransactionNotFound, BlockNotFound) as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                continue
            except Exception as e:
                logger.warning(f"RPC call failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                last_exception = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                continue
        raise last_exception

    async def get_chain_id(self) -> int:
        return await self._run_with_retry(self.w3.eth.chain_id)

    async def get_block_number(self) -> int:
        return await self._run_with_retry(self.w3.eth.block_number)

    async def get_transaction_receipt(self, tx_hash: str) -> Optional[TxReceipt]:
        try:
            return await self._run_with_retry(self.w3.eth.get_transaction_receipt, tx_hash)
        except TransactionNotFound:
            return None

    async def get_usdc_balance(self, address: str) -> int:
        if not is_valid_address(address):
            raise ValueError(f"Invalid address: {address}")
        checksum_addr = to_checksum_address(address)
        return await self._run_with_retry(self.usdc_contract.functions.balanceOf(checksum_addr).call)

    async def get_usdc_balance_formatted(self, address: str) -> str:
        balance_atomic = await self.get_usdc_balance(address)
        return self.format_atomic_to_decimal(balance_atomic)

    async def get_token_metadata(self) -> Dict[str, Any]:
        symbol = await self._run_with_retry(self.usdc_contract.functions.symbol().call)
        decimals = await self._run_with_retry(self.usdc_contract.functions.decimals().call)
        return {
            "symbol": symbol,
            "decimals": decimals,
            "address": USDC_CONTRACT_ADDRESS,
        }

    def parse_transfer_events(self, receipt: TxReceipt) -> List[Dict[str, Any]]:
        events = []
        for log in receipt.get("logs", []):
            try:
                if log.get("address", "").lower() == USDC_CONTRACT_ADDRESS.lower():
                    decoded = self.usdc_contract.events.Transfer().process_log(log)
                    events.append({
                        "from": decoded["args"]["from"],
                        "to": decoded["args"]["to"],
                        "value": decoded["args"]["value"],
                        "block_number": receipt["blockNumber"],
                        "transaction_hash": receipt["transactionHash"].hex(),
                        "log_index": log.get("logIndex"),
                    })
            except Exception:
                continue
        return events

    def find_matching_transfer(
        self,
        events: List[Dict[str, Any]],
        expected_from: str,
        expected_to: str,
        expected_value: int,
    ) -> Optional[Dict[str, Any]]:
        expected_from = expected_from.lower()
        expected_to = expected_to.lower()
        for event in events:
            if (
                event["from"].lower() == expected_from
                and event["to"].lower() == expected_to
                and event["value"] == expected_value
            ):
                return event
        return None

    @staticmethod
    def format_atomic_to_decimal(atomic_value: int) -> str:
        divisor = 10 ** USDC_DECIMALS
        whole = atomic_value // divisor
        fractional = atomic_value % divisor
        return f"{whole}.{fractional:0{USDC_DECIMALS}d}"

    @staticmethod
    def parse_decimal_to_atomic(decimal_str: str) -> int:
        if not decimal_str or decimal_str.strip() == "":
            raise ValueError("Empty amount")
        parts = decimal_str.strip().split(".")
        if len(parts) > 2:
            raise ValueError("Invalid decimal format")
        whole = parts[0] if parts[0] else "0"
        fractional = parts[1] if len(parts) == 2 else ""
        if len(fractional) > USDC_DECIMALS:
            raise ValueError(f"Too many decimal places (max {USDC_DECIMALS})")
        fractional = fractional.ljust(USDC_DECIMALS, "0")
        return int(whole) * (10 ** USDC_DECIMALS) + int(fractional)


base_sepolia_client = BaseSepoliaClient()