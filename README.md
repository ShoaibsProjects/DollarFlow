<!-- PROJECT SHIELD -->
<div align="center">

# DollarFlow

**Your dollars. Everywhere.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)
[![Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF?logo=coinbase)](https://sepolia.basescan.org/)
[![USDC](https://img.shields.io/badge/Token-USDC-2775CA?logo=circle)](https://www.circle.com/en/usdc)

</div>

A decentralized USDC stablecoin payment platform for global workers, freelancers, and travelers in emerging markets. Competing with Wise, Revolut, and Cash App on UX — while charging **$0.01 instead of $14**.

---

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend
cd frontend
yarn install
yarn start
```

---

## Architecture

```
┌─────────────────────────────┐
│  React SPA (Port 3000)      │
│  Tailwind · Framer · Wagmi  │
│  RainbowKit · Recharts      │
└──────────────┬──────────────┘
               │ REST
┌──────────────┴──────────────┐
│  FastAPI Server (Port 8001) │
│  MongoDB (Motor async)      │
│  SlowAPI rate limiting      │
└──────────────┬──────────────┘
               │ RPC
┌──────────────┴──────────────┐
│  Base Sepolia L2            │
│  USDC ERC-20 · MetaMask     │
│  WalletConnect · ENS        │
└─────────────────────────────┘
```

---

## Features

| Feature | Stack |
|---|---|
| **Dashboard** | Glass-morphism balance card, quick actions, ETH gas display, inflation shield |
| **Send Money** | 4-step flow (amount → recipient → review → confirm), on-chain USDC via MetaMask |
| **Receive Money** | QR code display, address copy, payment request links |
| **Family Vault** | Shared wallets with per-member allocations, progress bars, add-member flow |
| **DollarFlow Spots** | Leaflet interactive map, 25 cash-out agents across 3 cities, city filters |
| **Chat-to-Pay** | Claude Sonnet 4.5 AI — natural language payments ("send $50 to Mom") |
| **Analytics** | Fee savings counter, spending donut chart, currency trend area chart |
| **Inflation Shield** | Auto-convert earnings to USDC to hedge local currency depreciation |
| **Wallet Connect** | RainbowKit + Wagmi v3 on Base Sepolia — real on-chain ERC-20 transfers |
| **Security** | Transaction PIN, rate limiting, Pydantic input validation, XSS prevention |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Tailwind CSS 3, Framer Motion 12, Shadcn/UI, Recharts, Leaflet |
| **Backend** | FastAPI (Python 3.12), MongoDB (Motor), SlowAPI |
| **Blockchain** | Base Sepolia (Coinbase L2), USDC ERC-20, Wagmi 3, Viem 2, RainbowKit 2 |
| **AI** | Claude Sonnet 4.5 (via Emergent LLM API) |
| **Auth** | Emergent Google OAuth 2.0 |
| **Package** | Yarn 1.22, Create React App + CRACO |

---

## API Reference

22 endpoints across 10 domains. Full documentation in [DOCUMENTATION.md](./DOCUMENTATION.md).

| Domain | Endpoints |
|---|---|
| Auth | `GET /api/auth/session` · `/me` · `/logout` · `/onboard` |
| Transactions | `GET/POST /api/transactions` |
| Family Vault | `GET /api/family-vault` · `POST/PUT /api/family-vault/member` |
| Spots | `GET /api/spots` (with city/region filters) |
| Currencies | `GET /api/currencies` · `/history/{currency}` |
| Analytics | `GET /api/analytics` |
| Inflation Shield | `GET/PUT /api/inflation-shield` |
| Chat | `POST /api/chat` · `GET /api/chat/history` |
| Settings | `PUT /api/settings` |
| Dashboard | `GET /api/dashboard` |

---

## Environment Variables

### Backend (`/backend/.env`)

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=dollarflow
CORS_ORIGINS=*
EMERGENT_LLM_KEY=<your-key>
```

### Frontend (`/frontend/.env`)

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Live Data Sources

| Source | Data | Method |
|---|---|---|
| Wise API | Live international transfer fees | `api.wise.com/v3/quotes` |
| Base Sepolia RPC | Real-time gas prices | `eth_gasPrice` |
| Mock Exchange Rates | Currency conversion | Based on real rate snapshots |

---

## Documentation

Read [DOCUMENTATION.md](./DOCUMENTATION.md) for:
- Feature walkthroughs with screenshots
- 6 real-world use case scenarios
- Complete API reference (22 endpoints)
- Security architecture details
- FAQ

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

We follow [Conventional Commits](https://www.conventionalcommits.org/).

---

## License

MIT © 2026 DollarFlow
