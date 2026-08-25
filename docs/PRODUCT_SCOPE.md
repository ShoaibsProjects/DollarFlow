# DollarFlow V1 — Product Scope

## What is DollarFlow V1?

DollarFlow V1 is a **non-custodial, testnet-only USDC payment prototype** built on Base Sepolia. It demonstrates how a consumer payment app can leverage blockchain for real, verifiable transfers while maintaining clear boundaries between prototype and production financial services.

## Target User

- Developers and designers exploring Web3 payment UX
- Product teams evaluating non-custodial payment flows
- Users learning about USDC transfers on Base Sepolia testnet

## Supported Functionality (V1)

| Feature | Status | Notes |
|---------|--------|-------|
| Wallet connection (MetaMask, WalletConnect, Coinbase Wallet) | ✅ Implemented | Via RainbowKit + Wagmi |
| Wallet ownership proof (SIWE-style signed message) | ✅ Implemented | One-time nonce, cryptographic verification |
| Base Sepolia test USDC balance display | ✅ Implemented | Real-time via `eth_call` |
| Transaction intent creation | ✅ Implemented | Idempotent, with policy assessment |
| Transfer review with safety acknowledgements | ✅ Implemented | Mandatory checkbox before signing |
| Browser wallet signs USDC `transfer` | ✅ Implemented | User signs in MetaMask/connected wallet |
| Backend submits transaction hash | ✅ Implemented | Frontend → backend hash submission |
| Backend independent receipt verification | ✅ Implemented | Fetches receipt, parses Transfer event, matches all fields |
| Transaction status (confirmed/failed/mismatch) | ✅ Implemented | Clear UI for each state |
| Receive page with QR code & payment links | ✅ Implemented | Uses real linked wallet address |
| Transaction history with verification states | ✅ Implemented | Filterable list, detail view |
| Audit trail (hash-chained, append-only) | ✅ Implemented | SHA-256 chain, user-scoped |
| Support/complaint workflow | ✅ Implemented | Cases with categories, transaction linking |
| Testnet disclaimer on all pages | ✅ Implemented | Persistent banner + safety modals |

## Explicitly NOT Implemented (V1 Non-Goals)

| Feature | Reason |
|---------|--------|
| Base Mainnet / real USDC | V1 is testnet-only prototype |
| Real money, fiat, bank integration | Requires licenses, compliance, custody |
| CCTP / cross-chain transfers | Out of scope for V1 |
| Gas sponsorship / paymaster | Not a production service |
| Real KYC/AML/sanctions screening | Illustrative demo policy only |
| Account recovery / custodial features | Non-custodial by design |
| EIP-7702 / ERC-4337 account abstraction | Future enhancement |
| Production RPC / managed infrastructure | Public RPC only for V1 |
| Formal security audit | Prototype only |

## Feature Status Table

| Capability | V1 Status |
|------------|-----------|
| Wallet connection | ✅ Implemented |
| Wallet ownership proof | ✅ Implemented |
| Base Sepolia test USDC transfer | ✅ Implemented |
| Backend receipt verification | ✅ Implemented |
| Transaction audit trail | ✅ Implemented |
| Customer fund custody | ❌ Not supported (non-custodial) |
| Fiat / bank integration | ❌ Not supported |
| Mainnet transfers | ❌ Not supported |
| Real KYC/AML/sanctions | ❌ Not implemented |
| Legal/commercial compliance | ❌ Not claimed |

## Safety Disclosures

Every page displays: **"DollarFlow Testnet Preview — Uses Base Sepolia test USDC only. Test assets have no monetary value. Do not use DollarFlow for real financial transactions."**

Additional safety acknowledgements required before any transfer:
- Testnet tokens have no financial value
- Transfers are irreversible after wallet confirmation
- Verify recipient address carefully
- DollarFlow never receives or stores private keys

## Architecture Overview

```
Frontend (React 19 + Wagmi + RainbowKit)
    │
    ├── Wallet verification (SIWE-style nonce + signature)
    ├── Transfer intent creation (backend API)
    ├── Wallet signs USDC.transfer() (MetaMask/RainbowKit)
    ├── Submit tx hash to backend
    └── Poll verification status
                │
                ▼
Backend (FastAPI + MongoDB)
    │
    ├── Wallet auth nonces (TTL, single-use)
    ├── Wallet links (user-scoped)
    ├── Transaction intents (idempotent, atomic units)
    ├── Chain verification (Web3.py → Base Sepolia RPC)
    │   ├── Fetch receipt
    │   ├── Parse Transfer events
    │   ├── Match sender/recipient/amount/contract/chain
    │   └── Set status: CONFIRMED / FAILED / EXCEPTION_MISMATCH
    ├── Audit events (hash-chained, append-only)
    ├── Demo compliance policy (illustrative only)
    └── Support cases (user-scoped)
                │
                ▼
Base Sepolia (Chain ID 84532)
    │
    ├── USDC Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    ├── Public RPC: https://sepolia.base.org
    └── Explorer: https://sepolia.basescan.org
```

## Trust Boundaries

1. **Private keys never leave user's browser** — Wallet signs in MetaMask/RainbowKit
2. **Backend never initiates transactions** — Only verifies receipts
3. **Amounts in atomic units** — No floating-point math anywhere
4. **User-scoped authorization** — All endpoints verify ownership
5. **Audit events append-only** — Hash-chained, tamper-evident
6. **Idempotency on all writes** — Client request IDs prevent duplicates