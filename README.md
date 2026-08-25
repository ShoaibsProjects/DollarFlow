<!-- PROJECT SHIELD -->
<div align="center">

# DollarFlow V1

**Testnet Prototype — Non-Custodial USDC Payments on Base Sepolia**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)
[![Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF?logo=coinbase)](https://sepolia.basescan.org/)
[![USDC](https://img.shields.io/badge/Token-USDC-2775CA?logo=circle)](https://www.circle.com/en/usdc)
[![Testnet Only](https://img.shields.io/badge/Testnet%20Only-%E2%9A%A0%EF%B8%8F-orange)](https://docs.base.org/base-chain/quickstart/connecting-to-base)

</div>

---

> **⚠️ DOLLARFLOW V1 IS A TESTNET PROTOTYPE**
>
> This is a **non-custodial, testnet-only USDC payment prototype** built on Base Sepolia.
>
> - **No real money**: Uses Base Sepolia test USDC only (no monetary value)
> - **Non-custodial**: Your private keys never leave your wallet
> - **No compliance claims**: No KYC, AML, sanctions screening, or regulatory licensing
> - **Not a financial service**: Not a bank, exchange, remittance, or custodian
>
> **Do not use DollarFlow for real financial transactions.**

---

## What Is DollarFlow V1?

DollarFlow V1 demonstrates a **non-custodial USDC payment flow** with:

| Capability | V1 Status |
|------------|-----------|
| Wallet connection (MetaMask, WalletConnect, Coinbase Wallet) | ✅ Implemented |
| Wallet ownership proof (SIWE-style signed message) | ✅ Implemented |
| Base Sepolia test USDC balance display | ✅ Implemented |
| Transaction intent creation (idempotent, with policy) | ✅ Implemented |
| Transfer review with safety acknowledgements | ✅ Implemented |
| Browser wallet signs real USDC `transfer()` | ✅ Implemented |
| Backend submits tx hash for verification | ✅ Implemented |
| **Independent chain receipt verification** | ✅ Implemented |
| Transaction status (confirmed/failed/mismatch) | ✅ Implemented |
| Receive page with QR code + payment links | ✅ Implemented |
| Transaction history with verification states | ✅ Implemented |
| Audit trail (hash-chained, append-only) | ✅ Implemented |
| Support/complaint workflow | ✅ Implemented |
| Testnet disclaimers on all pages | ✅ Implemented |

### Explicitly NOT Implemented (V1 Non-Goals)

| Feature | Reason |
|---------|--------|
| Base Mainnet / real USDC | Testnet prototype only |
| Real money, fiat, bank integration | Requires licenses, compliance |
| CCTP / cross-chain transfers | Out of scope |
| Gas sponsorship / paymaster | Not a production service |
| Real KYC/AML/sanctions screening | Illustrative demo policy only |
| Account recovery / custodial features | Non-custodial by design |
| EIP-7702 / ERC-4337 account abstraction | Future enhancement |
| Production RPC / managed infrastructure | Public RPC only for V1 |
 | Formal security audit | Prototype only |

---

## Engineering Highlights

- **Non-custodial by construction** — private keys never leave the browser wallet; the server only issues single-use expiring nonces and verifies EIP-191 signatures against them.
- **Settlement reconciliation** — a transfer is marked final only after an independent backend read of the on-chain receipt and `Transfer` event log matches the signed intent exactly (recipient, amount, sender).
- **Tamper-evident audit trail** — every auth/transfer state transition is appended to a SHA-256 hash-chained event log with a `/audit/verify-chain` integrity endpoint.
- **Idempotent intent creation** — client-generated `client_request_id` keys prevent duplicate submissions under retry or double-click.
- **Layered security middleware** — double-submit CSRF tokens, Origin/Referer validation, per-endpoint rate limiting, Pydantic-validated inputs, and strict CORS (wildcard rejected at boot).
- **Verified codebase** — 73-test pytest suite covering cross-user authorization, replay resistance, audit-chain integrity, and policy screening; frontend gated by `tsc --noEmit` + Vite production build.

---

## Quick Start

### Prerequisites
- Node.js 18+, Yarn 1.22+
- Python 3.10+, MongoDB 6.0+
- MetaMask (or compatible wallet) with Base Sepolia testnet

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values

pip install -r requirements.txt

# Start MongoDB (if not running)
mongod  # or: docker run -d -p 27017:27017 --name mongo mongo:6

# Start backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env

yarn install
yarn start
```

### 3. Testnet Wallet Setup

1. **Add Base Sepolia to MetaMask**:
   - Network: Base Sepolia
   - RPC: https://sepolia.base.org
   - Chain ID: 84532
   - Explorer: https://sepolia.basescan.org

2. **Get Test ETH**: https://www.alchemy.com/faucets/base-sepolia

3. **Get Test USDC**: https://faucet.circle.com/ (select Base Sepolia)

4. **Add Test USDC Token** in MetaMask:
   - Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Symbol: USDC
   - Decimals: 6

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  React 19   │  │  Wallet     │  │  Private Keys           │ │
│  │  (Wagmi)    │  │  (MetaMask) │  │  (NEVER leave browser)  │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘ │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
     HTTPS │                │ Wallet signs USDC.transfer()
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOLLARFLOW BACKEND                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  FastAPI    │  │  MongoDB    │  │  Private Keys           │ │
│  │  (API)      │  │  (Data)     │  │  (NEVER HERE)           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │
          │ Read-only RPC
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BASE SEPOLIA                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Public RPC │  │  USDC       │  │  User's EOA             │ │
│  │  (read)     │  │  Contract   │  │  (signs transfer)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Non-Custodial Transaction Flow

```
1. User connects wallet (MetaMask/RainbowKit)
2. SIWE-style nonce challenge → user signs message (NOT a tx)
3. Backend verifies signature → links wallet to user
4. User creates transfer intent (amount, recipient, purpose)
5. User reviews + acknowledges safety disclosures
6. Wallet signs USDC.transfer(recipient, amount) → Base Sepolia
7. Frontend submits tx hash to backend
8. Backend INDEPENDENTLY:
   - Fetches receipt from Base Sepolia RPC
   - Parses Transfer events
   - Matches sender, recipient, amount, contract, chain ID
9. Status: CONFIRMED | FAILED | EXCEPTION_MISMATCH
10. Frontend displays result (only after backend verification)
```

---

## Features

### Core Payment Flow
- **Wallet Verification**: SIWE-style signed nonce proves ownership without tx
- **Send USDC**: 4-step flow with safety acknowledgements
- **Receive USDC**: QR code, copy address, payment request links
- **Real-time Balance**: `eth_call` to Base Sepolia USDC contract

### Verification & Safety
- **Independent Verification**: Backend fetches receipt, parses Transfer events, matches all fields
- **Mismatch Detection**: WRONG_RECIPIENT, WRONG_AMOUNT, WRONG_TOKEN, WRONG_CHAIN, MISSING_TRANSFER_EVENT
- **Safety Acknowledgements**: Mandatory checkbox before signing
- **Testnet Disclaimers**: Persistent banner on every page

### Transparency & Audit
- **Transaction History**: Filterable list with status badges
- **Detail View**: Intent vs observed values, audit timeline
- **Audit Trail**: Hash-chained (SHA-256), append-only, tamper-evident
- **Support/Complaints**: Cases linked to transactions, demo workflow

### Demo Compliance Layer
- **Illustrative Policy**: CLEAR / REVIEW / BLOCKED with mandatory disclaimer
- **Not Real Compliance**: No KYC, AML, sanctions, Travel Rule

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, TypeScript 5 (strict), Vite 6, Tailwind CSS 3, Framer Motion 12, Wagmi 2, Viem 2, RainbowKit 2, Radix UI, Recharts, QRCode.react |
| **Backend** | FastAPI (Python 3.12), MongoDB (Motor async), SlowAPI, Web3.py, eth-account, Pydantic v2 |
| **Blockchain** | Base Sepolia (Chain ID 84532), USDC ERC-20 (0x036CbD...CF7e), Public RPC |
| **Auth** | Emergent Google OAuth 2.0 (existing) |
| **Package** | Yarn 1.22, Vite + `tsc --noEmit` type-check gate |

---

## API Reference (V1 Endpoints)

**Total: 46 API endpoints** (21 existing + 25 new V1 endpoints)

### Wallet Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallet-auth/nonce` | Request verification nonce |
| POST | `/api/wallet-auth/verify` | Verify signed message |
| GET | `/api/wallet-auth/me` | List linked wallets |
| POST | `/api/wallet-auth/select` | Set default wallet |
| POST | `/api/wallet-auth/unlink` | Unlink wallet (requires signature) |

### Transaction Intents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transaction-intents` | Create intent (idempotent) |
| GET | `/api/transaction-intents` | List user's intents |
| GET | `/api/transaction-intents/{id}` | Get intent details |
| POST | `/api/transaction-intents/{id}/submit` | Submit tx hash |
| POST | `/api/transaction-intents/{id}/cancel` | Cancel before submit |
| POST | `/api/transaction-intents/{id}/verify` | Trigger verification |
| GET | `/api/transaction-intents/config/chain` | Chain config for frontend |

### Blockchain
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blockchain/usdc-balance` | Real-time USDC balance |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/events` | User's audit events (read-only) |
| GET | `/api/audit/events/{type}/{id}` | Events for specific resource |
| GET | `/api/audit/verify-chain` | Verify hash chain integrity |

### Compliance Demo
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/compliance-demo/assess` | Illustrative policy assessment |

### Support
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/support/cases` | Create case |
| GET | `/api/support/cases` | List user's cases |
| GET | `/api/support/cases/{id}` | Get case details |
| POST | `/api/support/cases/{id}/comment` | Add comment |

---

## Environment Variables

### Backend (`backend/.env`)

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=dollarflow
CORS_ORIGINS=http://localhost:3000

# Base Sepolia (V1: DO NOT CHANGE)
BASE_SEPOLIA_CHAIN_ID=84532
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_SEPOLIA_EXPLORER_URL=https://sepolia.basescan.org
BASE_SEPOLIA_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_SEPOLIA_USDC_DECIMALS=6

# Wallet Auth
WALLET_AUTH_DOMAIN=localhost:3000
WALLET_AUTH_NONCE_TTL_SECONDS=300
TRANSACTION_INTENT_TTL_SECONDS=900
DEMO_TRANSFER_CAP_USDC=1000.00

# Security
AUDIT_HASH_SALT=replace-with-local-dev-secret
DEMO_MODE=false

# Existing
EMERGENT_LLM_KEY=your-key
```

### Frontend (`frontend/.env`)

```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
REACT_APP_BASE_SEPOLIA_EXPLORER_URL=https://sepolia.basescan.org
REACT_APP_BASE_SEPOLIA_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
REACT_APP_BASE_SEPOLIA_USDC_DECIMALS=6
REACT_APP_WALLET_AUTH_DOMAIN=localhost:3000
REACT_APP_DEMO_TRANSFER_CAP_USDC=1000.00
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRODUCT_SCOPE.md](docs/PRODUCT_SCOPE.md) | V1 scope, features, non-goals, architecture |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagrams, flow details, trust boundaries |
| [SECURITY_MODEL.md](docs/SECURITY_MODEL.md) | Private key boundary, nonce flow, amounts, auth, audit |
| [COMPLIANCE_BOUNDARIES.md](docs/COMPLIANCE_BOUNDARIES.md) | Not a compliance product, future integration points |
| [DISCLOSURES_AND_CONSUMER_SAFETY.md](docs/DISCLOSURES_AND_CONSUMER_SAFETY.md) | Testnet disclaimer, finality warnings, support limits |
| [INCIDENT_AND_COMPLAINTS.md](docs/INCIDENT_AND_COMPLAINTS.md) | Severity model, RPC outage, mismatch, case lifecycle |
| [THREAT_MODEL.md](docs/THREAT_MODEL.md) | STRIDE analysis, attack trees, risk matrix |
| [RUNBOOK.md](docs/RUNBOOK.md) | Local setup, testnet wallet, tests, troubleshooting |
| [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | 3-5 minute demo walkthrough |

---

## Running Tests

### Backend

```bash
cd backend
pip install pytest pytest-asyncio httpx
python -m pytest tests/ -v
```

### Frontend

```bash
cd frontend
yarn test --watchAll=false
yarn build  # Verify no compile errors
```

### CI Pipeline (`.github/workflows/ci.yml`)

```yaml
# Runs on every PR:
# 1. Frontend: yarn install && yarn build
# 2. Backend: pip install -r requirements.txt && python -m pytest tests/
```

---

## Project Structure

```
DollarFlow/
├── backend/
│   ├── server.py                 # Existing FastAPI (preserved)
│   ├── .env.example
│   ├── requirements.txt
│   ├── app/
│   │   ├── config.py             # Base Sepolia config
│   │   ├── dependencies.py       # FastAPI deps
│   │   ├── routers/              # V1 API routers
│   │   │   ├── wallet_auth.py
│   │   │   ├── transfer_intents.py
│   │   │   ├── blockchain.py
│   │   │   ├── audit.py
│   │   │   ├── compliance_demo.py
│   │   │   └── support.py
│   │   ├── schemas/              # Pydantic models
│   │   ├── services/             # Business logic
│   │   │   ├── wallet_auth_service.py
│   │   │   ├── transfer_service.py
│   │   │   ├── chain_verification_service.py
│   │   │   ├── audit_service.py
│   │   │   ├── compliance_demo_service.py
│   │   │   └── support_service.py
│   │   ├── blockchain/           # Read-only chain client
│   │   │   ├── erc20_abi.py
│   │   │   └── base_sepolia_client.py
│   │   └── utils/                # Helpers
│   │       ├── canonical_json.py
│   │       ├── evm_addresses.py
│   │       └── amounts.py
│   └── tests/                    # Backend tests
│
├── frontend/
│   ├── src/
│   │   ├── config/               # Blockchain config
│   │   ├── services/             # API clients
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useWalletVerification.js
│   │   │   ├── useUSDCTransfer.js
│   │   │   └── useTransactionVerification.js
│   │   ├── components/           # Reusable UI
│   │   │   ├── TestnetBanner.jsx
│   │   │   ├── WalletVerificationCard.jsx
│   │   │   ├── TransferReviewModal.jsx
│   │   │   ├── TransactionStatusTimeline.jsx
│   │   │   ├── ReceiveQRCode.jsx
│   │   │   ├── SafetyDisclosureModal.jsx
│   │   │   └── SupportTicketForm.jsx
│   │   ├── pages/                # Route pages
│   │   │   ├── SendMoney.js      # Enhanced with V1 flow
│   │   │   ├── ReceiveMoney.js   # Enhanced with real wallet
│   │   │   ├── Transactions.js   # New: history with verification
│   │   │   ├── TransactionDetail.js # New: detail + audit
│   │   │   ├── WalletSecurity.js # New: safety center
│   │   │   ├── Support.js        # New: cases + complaints
│   │   │   └── ...existing pages
│   │   └── App.js                # Updated routes
│   ├── .env.example
│   └── package.json
│
├── docs/                         # Complete documentation
└── .github/workflows/ci.yml      # CI pipeline
```

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push branch: `git push origin feat/my-feature`
5. Open Pull Request

**We follow [Conventional Commits](https://www.conventionalcommits.org/).**

### Development Guidelines

- **Preserve existing features** — V1 adds new modules, doesn't remove old ones
- **Non-custodial first** — Private keys never in backend
- **Atomic units everywhere** — No float/Decimal for money
- **User-scoped authorization** — Every endpoint checks ownership
- **Idempotency** — Client request IDs on all writes
- **Audit everything** — Hash-chained, append-only
- **Testnet disclaimers** — Every page, every step

---

## License

MIT © 2026 DollarFlow

---

## Disclaimer

**DollarFlow V1 is a testnet prototype for educational and demonstration purposes only.**

- Uses Base Sepolia test USDC (no monetary value)
- Non-custodial: private keys never leave user's wallet
- No KYC, AML, sanctions screening, Travel Rule, or regulatory compliance
- Not a bank, exchange, money transmitter, remittance service, or custodian
- No guarantees of uptime, finality, speed, or fee amounts
- Base Sepolia public RPC is rate-limited and not for production

**Do not use DollarFlow for real financial transactions.**