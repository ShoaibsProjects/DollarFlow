# DollarFlow

> **Your dollars. Everywhere.**

A decentralized USDC stablecoin payment platform for global workers, freelancers, and travelers in emerging markets. Built to compete with Wise, Revolut, and Cash App in design quality — while charging $0.01 instead of $14.

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

## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Dashboard** | Glass-morphism balance card, quick actions, recent transactions |
| **Send Money** | 4-step flow with family contacts, on-chain USDC transfers via MetaMask |
| **Receive Money** | QR code, copy address, payment request links |
| **Family Vault** | Shared wallet with per-member allocations and spending tracking |
| **DollarFlow Spots** | Interactive Leaflet map with 25 cash-out agents across 3 cities |
| **Chat-to-Pay** | Claude AI assistant — type "send $50 to Mom" and it just works |
| **Analytics** | Fee savings counters, spending charts, currency trend analysis |
| **Inflation Shield** | Auto-convert earnings to USDC to protect from local currency depreciation |
| **Wallet Connect** | RainbowKit + Wagmi on Base Sepolia — real on-chain transactions |
| **Security** | Transaction PIN, rate limiting, input validation, XSS prevention |

## Live Data

- **Wise fees** — pulled from `api.wise.com/v3/quotes` (no API key needed)
- **DollarFlow gas fees** — computed from Base Sepolia RPC `eth_gasPrice`
- **Exchange rates** — mock data based on real rates

## Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion, Shadcn/UI, Recharts, Leaflet, RainbowKit, Wagmi, Viem
- **Backend**: FastAPI, MongoDB (Motor), SlowAPI (rate limiting), Pydantic validation
- **AI**: Claude Sonnet 4.5 via Emergent LLM key
- **Auth**: Emergent Google OAuth
- **Blockchain**: Base Sepolia (Coinbase L2), USDC ERC-20 transfers

## Documentation

See **[DOCUMENTATION.md](./DOCUMENTATION.md)** for the complete guide including:
- Detailed feature walkthroughs with screenshots
- 6 real-world use case scenarios
- Full API reference (22 endpoints)
- Security architecture
- FAQ

## Environment Variables

### Backend (`/backend/.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=<your-key>
```

### Frontend (`/frontend/.env`)
```
REACT_APP_BACKEND_URL=<your-backend-url>
```

## License

MIT
