# DollarFlow V1 — Security Model

## Private Key Boundary

**Invariant**: Private keys and seed phrases **never leave the user's browser wallet**.

```
┌─────────────────────────────────────────────────────────────────┐
│ USER'S BROWSER                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Wallet (MetaMask, Coinbase Wallet, WalletConnect, etc.)     │ │
│ │ • Generates/stores private keys                             │ │
│ │ • Signs transactions (eth_sign, personal_sign, eth_sendTx)  │ │
│ │ • Private keys NEVER exposed to JavaScript                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ Signature│        │ Tx Hash  │        │ Public   │
    │ (hex)    │        │ (hex)    │        │ Address  │
    └──────────┘        └──────────┘        └──────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ DOLLARFLOW BACKEND                                              │
│ • Receives: signatures, tx hashes, public addresses             │
│ • NEVER receives: private keys, seed phrases, recovery phrases  │
│ • NEVER stores: exported wallet JSON, keystore files            │
│ • NEVER initiates: blockchain transactions                      │
└─────────────────────────────────────────────────────────────────┘
```

### What Backend Receives
- Wallet signatures (SIWE-style message verification)
- Transaction hashes (after user signs in wallet)
- Public wallet addresses (checksum-normalized)

### What Backend NEVER Receives
- Private keys (raw or encrypted)
- Seed phrases / recovery phrases (12/24 words)
- Wallet keystore files (JSON/UTC)
- Any user signing secrets

## Signed Nonce Flow (Wallet Ownership Proof)

### Threat Model Addressed
- **Replay attacks**: Nonce is single-use, expires in 300s
- **Phishing**: Message includes domain, chain ID, clear statement
- **Man-in-the-middle**: TLS + signature verification
- **Cross-site request forgery**: Nonce bound to authenticated user session

### Flow
```
1. User clicks "Verify Wallet" in UI
2. Frontend: POST /api/wallet-auth/nonce { wallet_address }
3. Backend: Creates nonce (32 random bytes), stores with:
   - user_id (from session)
   - wallet_address (normalized)
   - domain, chain_id, issued_at, expires_at (+300s)
   - status: "active", attempt_count: 0
4. Backend returns: nonce, domain, chain_id, message_template
5. Frontend: Shows message_template, calls wallet.signMessage()
6. User signs in wallet (personal_sign)
7. Frontend: POST /api/wallet-auth/verify { wallet_address, signature, message }
8. Backend verifies:
   a. Nonce exists, status="active", not expired
   b. Nonce belongs to authenticated user
   c. Message matches template EXACTLY (prevents message substitution)
   d. eth_account.recover_message(message) == wallet_address
9. Backend: Invalidates nonce (status="used", used_at=now)
10. Backend: Creates/updates wallet_links record
11. Backend: Emits WALLET_LINKED audit event
```

### Security Properties
| Property | Implementation |
|----------|----------------|
| Single-use | Nonce status → "used" after verification |
| Expiry | TTL 300s, MongoDB TTL index on `expires_at` |
| Binding | Nonce tied to user_id, wallet_address, domain, chain_id |
| Message integrity | Full message comparison, not just nonce |
| Replay prevention | Nonce invalidated immediately after use |
| Rate limiting | 10/min on nonce & verify endpoints |

## Amount Handling (Atomic Units)

### Why Atomic Units?
- JavaScript `number` / Python `float` lose precision > 2^53
- USDC has 6 decimals → max precise integer = 999,999,999,999.99
- Floating-point errors cause silent money bugs

### Implementation

**Frontend (Viem):**
```javascript
import { parseUnits, formatUnits } from 'viem';

const USDC_DECIMALS = 6;

// Display → Atomic
const amountAtomic = parseUnits("25.50", USDC_DECIMALS); // 25500000n

// Atomic → Display
const display = formatUnits(25500000n, USDC_DECIMALS); // "25.50"
```

**Backend (Python Decimal):**
```python
from decimal import Decimal, InvalidOperation

USDC_DECIMALS = 6

def parse_usdc_to_atomic(amount_str: str) -> int:
    decimal_value = Decimal(amount_str.strip())
    if decimal_value <= 0:
        raise ValueError("Amount must be positive")
    if decimal_value.as_tuple().exponent < -USDC_DECIMALS:
        raise ValueError(f"Too many decimal places (max {USDC_DECIMALS})")
    return int(decimal_value * (10 ** USDC_DECIMALS))

def format_atomic_to_usdc(atomic: int) -> str:
    divisor = 10 ** USDC_DECIMALS
    whole = atomic // divisor
    fractional = atomic % divisor
    if fractional == 0:
        return str(whole)
    fractional_str = str(fractional).zfill(USDC_DECIMALS).rstrip("0")
    return f"{whole}.{fractional_str}"
```

### Storage
- Database: `amount_atomic` stored as STRING (MongoDB) or BIGINT (Postgres)
- API: Always string representation of integer
- Display: Formatted on frontend only

## API Authorization (User-Scoped)

### Every Write Endpoint
```python
async def get_current_user_id(request: Request) -> str:
    user = await get_current_user(request)  # Validates session cookie
    return user["user_id"]
```

### Every Read Endpoint
```python
# User can only access their own data
intent = await db.intents.find_one({"id": intent_id, "user_id": user_id})
wallet = await db.wallet_links.find_one({"wallet_address": addr, "user_id": user_id})
case = await db.support_cases.find_one({"id": case_id, "user_id": user_id})
```

### No Cross-User Access
- Wallet addresses in URL/path are validated against ownership
- Transaction hashes in path verified against user's intents
- Support cases filtered by `user_id`

## Idempotency Protections

### Transaction Intent Creation
```python
# Client generates UUID
client_request_id = f"req_{timestamp}_{random}"

# Backend checks before insert
existing = await intents.find_one({
    "user_id": user_id,
    "client_request_id": client_request_id
})
if existing:
    return existing  # Idempotent: return same intent
```

### Hash Submission
```python
# Only allow setting hash once
if intent["transaction_hash"] and intent["transaction_hash"] != new_hash:
    raise ValueError("Intent already has different transaction hash")

await intents.update_one(
    {"id": intent_id, "transaction_hash": None},
    {"$set": {"transaction_hash": new_hash, "status": "SUBMITTED"}}
)
```

### Verification
```python
# Idempotent: same result every call
existing = await verifications.find_one({"intent_id": intent_id})
if existing and existing["verification_status"] in ["matched", "mismatch", "failed"]:
    return existing  # Already verified
```

## Audit Event Hash Chain

### Structure
```python
event_hash = SHA256(previous_event_hash + canonical_json(payload))
```

### Canonical JSON
```python
def canonical_json(data):
    return json.dumps(
        data,
        separators=(",", ":"),
        sort_keys=True,
        ensure_ascii=True,
    )
```

### Verification
```python
def verify_chain(events):
    prev_hash = "0" * 64  # Genesis
    for event in events:
        expected = compute_event_hash(prev_hash, event["event_payload_json"])
        if event["event_hash"] != expected:
            return False  # Tampered
        prev_hash = event["event_hash"]
    return True
```

### Properties
- **Append-only**: No UPDATE/DELETE endpoints for audit events
- **Tamper-evident**: Any modification breaks hash chain
- **User-scoped**: Users can only read their own audit events
- **Genesis hash**: `"0" * 64` for first event

## Known Security Limitations (V1)

| Limitation | Impact | Mitigation (V2+) |
|------------|--------|------------------|
| Public RPC rate-limited | Verification may timeout | Managed RPC provider (Alchemy/Infura) |
| No CSRF tokens on cookie auth | Theoretical CSRF on write endpoints | Add CSRF middleware |
| No hardware wallet enforcement | User could use software wallet | Ledger/Trezor integration |
| No rate limit per user (global only) | Abuse potential | Per-user rate limits |
| Audit hash salt in env | If leaked, chain can be forged | HSM/KMS for salt |
| No encryption at rest for MongoDB | Data exposure if DB compromised | Enable MongoDB encryption |
| No request signing verification | Frontend could be compromised | EIP-712 signed requests |
| IP/user-agent not fully redacted | Privacy concern | Hash with salt before storage |

## Production Changes Required

1. **Replace public RPC** → Alchemy/Infura/QuickNode with dedicated endpoints
2. **Add CSRF protection** → Double-submit cookie or header-based
3. **Enable MongoDB encryption** → Encryption at rest + TLS in transit
4. **Use HSM/KMS** → For audit hash salt, any signing keys
5. **Per-user rate limits** → Redis-backed sliding window
6. **Request signing** → EIP-712 signed payloads for critical operations
7. **Hardware wallet support** → Ledger Live / Trezor Connect integration
8. **Formal penetration testing** → Before any real-money launch
9. **Incident response plan** → For key compromise, RPC outage, mismatch events
10. **Compliance integration** → Real KYC/AML, sanctions screening, Travel Rule