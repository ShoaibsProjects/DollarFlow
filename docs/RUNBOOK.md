# DollarFlow V1 — Runbook

## Local Development Setup

### Prerequisites
- **Node.js**: 18+ (for frontend)
- **Yarn**: 1.22+ (frontend package manager)
- **Python**: 3.10+ (backend)
- **MongoDB**: 6.0+ (local or Docker)
- **Git**: For version control

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/ShoaibsProjects/DollarFlow.git
cd DollarFlow

# 2. Backend setup
cd backend
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Install Python dependencies
pip install -r requirements.txt

# Start MongoDB (if not running)
# Option A: Local MongoDB
mongod

# Option B: Docker
docker run -d -p 27017:27017 --name mongo mongo:6

# Start backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 3. Frontend setup (new terminal)
cd frontend
cp .env.example .env
# Edit .env if needed

# Install dependencies
yarn install

# Start frontend
yarn start
```

### Verify Installation

1. **Frontend**: Open http://localhost:3000 → Should see DollarFlow landing page
2. **Backend API**: Open http://localhost:8001/docs → Should see FastAPI Swagger UI
3. **MongoDB**: Check `dollarflow` database exists with collections

---

## Testnet Wallet Setup

### Required Testnet Assets

| Asset | Network | How to Get |
|-------|---------|------------|
| **Test ETH** | Base Sepolia | https://www.alchemy.com/faucets/base-sepolia |
| **Test USDC** | Base Sepolia | https://faucet.circle.com/ (select Base Sepolia) |

### Wallet Configuration

1. **Install MetaMask** (or Coinbase Wallet, Rainbow, etc.)
2. **Add Base Sepolia Network**:
   - Network Name: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.basescan.org
3. **Import Test USDC Token**:
   - Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
   - Symbol: USDC
   - Decimals: 6
4. **Get Test ETH**: Visit https://www.alchemy.com/faucets/base-sepolia → Enter wallet address
5. **Get Test USDC**: Visit https://faucet.circle.com/ → Select Base Sepolia → Enter wallet address

### Verify Wallet Setup

1. Open DollarFlow at http://localhost:3000
2. Click "Get Started" → Sign in with Google (Emergent OAuth)
3. In sidebar/top bar, click wallet connect button
4. Select MetaMask → Connect
5. Wallet should show on Dashboard with test USDC balance

---

## Environment Variables

### Backend (`backend/.env`)

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=dollarflow

# CORS
CORS_ORIGINS=http://localhost:3000

# Base Sepolia (DO NOT CHANGE FOR V1)
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

# Emergent LLM (existing)
EMERGENT_LLM_KEY=your-emergent-key
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

## Running Tests

### Backend Tests

```bash
cd backend
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_wallet_auth.py -v

# Run with coverage
pip install pytest-cov
python -m pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend
# Run tests
yarn test --watchAll=false

# Build test (verifies no compile errors)
yarn build
```

### CI Pipeline

```bash
# GitHub Actions runs:
# 1. Frontend: yarn install && yarn build
# 2. Backend: pip install -r requirements.txt && python -m pytest tests/
```

---

## Demo Reset / Seed Data

### Enable Demo Mode

```bash
# Backend
export DEMO_MODE=true
# Or edit .env: DEMO_MODE=true

# Restart backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Seed Demo Data

```bash
cd backend
python scripts/seed_demo.py
```

This creates:
- 1 demo user (with session)
- 1 linked wallet (placeholder address)
- 1 confirmed transaction
- 1 pending transaction
- 1 failed transaction
- 1 mismatch transaction
- 1 support case
- Demo blocked/review wallet addresses

### Manual Reset

```bash
# Drop MongoDB database
mongosh --eval "db.getSiblingDB('dollarflow').dropDatabase()"

# Restart backend (will re-create collections)
# Re-seed if DEMO_MODE=true
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ModuleNotFoundError: motor` | Missing dependency | `pip install motor` |
| `ModuleNotFoundError: web3` | Missing dependency | `pip install web3` |
| `Connection refused: 27017` | MongoDB not running | Start MongoDB |
| `CORS error` | Frontend can't reach backend | Check `CORS_ORIGINS` in backend .env |
| `Wallet not connecting` | Wrong network in MetaMask | Switch to Base Sepolia (Chain ID 84532) |
| `USDC balance shows 0` | No test USDC in wallet | Get from Circle faucet |
| `Verification stuck "Confirming..."` | RPC timeout or rate limit | Wait, click "Verify" again |
| `Nonce invalid/expired` | Took too long to sign | Click "Verify Wallet" again for new nonce |
| `Transaction failed` | Insufficient test ETH for gas | Get test ETH from Alchemy faucet |
| `Mismatch: WRONG_RECIPIENT` | Sent to different address | Check transaction on BaseScan |

### Logs

```bash
# Backend logs (uvicorn output)
# Look for:
# - "Wallet linked for user"
# - "Intent created"
# - "Transaction submitted"
# - "Verification: matched/mismatch/failed"

# Frontend console (F12)
# Look for:
# - Wallet connection events
# - API request/response
# - Wagmi errors
```

---

## Production Deployment Notes (Not for V1)

### Required Changes for Production

| Area | V1 | Production |
|------|----|------------|
| RPC | Public (rate-limited) | Managed (Alchemy/Infura) |
| Database | Local MongoDB | MongoDB Atlas / DocumentDB |
| Secrets | `.env` file | AWS Secrets Manager / Doppler |
| Rate Limits | IP-based | Per-user + Redis |
| CSRF | None | Double-submit cookie |
| Monitoring | None | Prometheus + Grafana |
| Logging | Console | Structured JSON + aggregation |
| TLS | Self-signed (dev) | Valid cert (Let's Encrypt/ACM) |
| Database | Unencrypted | Encryption at rest + TLS |
| Backup | None | Automated daily + PITR |
| CI/CD | Manual | GitHub Actions + staging |

### Scaling Considerations

| Component | V1 | Production |
|-----------|----|------------|
| Backend | Single process | 3+ replicas + load balancer |
| MongoDB | Single node | Replica set (3 nodes) |
| RPC | Public | Managed (Alchemy/Infura) + failover |
| Rate Limiting | In-memory | Redis-backed distributed |
| Sessions | Cookie | JWT + Redis session store |

---

## Quick Reference Commands

```bash
# Full stack start (3 terminals)
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
cd backend && uvicorn server:app --reload --port 8001

# Terminal 3: Frontend
cd frontend && yarn start

# Run tests
cd backend && python -m pytest tests/ -v
cd frontend && yarn test --watchAll=false

# Build frontend for production
cd frontend && yarn build

# Seed demo data
cd backend && python scripts/seed_demo.py

# Reset database
mongosh --eval "db.getSiblingDB('dollarflow').dropDatabase()"
```

---

## Support

- **Documentation**: `/docs` folder
- **Issues**: GitHub Issues
- **Demo Script**: `docs/DEMO_SCRIPT.md`
- **Architecture**: `docs/ARCHITECTURE.md`