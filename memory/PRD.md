# DollarFlow - Product Requirements Document

## Original Problem Statement
Build DollarFlow — a decentralized USDC stablecoin payment platform for global workers, freelancers, and travelers in emerging markets. Production-quality with modern UI competing with Wise, Revolut, and Cash App.

## Architecture
- **Frontend**: React + Tailwind CSS + Framer Motion + Shadcn/UI + Recharts + Leaflet
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: Emergent Google OAuth
- **AI**: Claude Sonnet 4.5 via Emergent LLM key (Chat-to-Pay)
- **Design**: Dark mode default, glass-morphism, gradient mesh hero, Space Grotesk + Inter fonts

## User Personas
1. **Migrant Workers** (US/UK/Gulf) — send money home to family in Philippines, Nigeria, Argentina
2. **Freelancers** in emerging markets — protect earnings from local currency depreciation
3. **Travelers** — need global dollar access and local cash-out points
4. **Non-crypto users** — want banking-app UX, no crypto jargon

## Core Requirements
- Beautiful fintech UI (Linear meets Cash App aesthetic)
- One-click Google sign-in
- Dashboard with balance, quick actions, inflation shield
- Send/receive money flows
- Family Vault with member cards and allocations
- Interactive map of cash-out agents (DollarFlow Spots)
- Chat-to-Pay with Claude AI (conversational payments)
- Smart analytics with fee comparison charts
- Profile & settings with dark/light mode toggle

## What's Been Implemented (Feb 21, 2026)

### Pages Built (10/10)
1. **Landing Page** — Hero with gradient mesh, 6 feature cards, fee comparison table, 3 testimonials, trust signals, CTA
2. **Auth Callback** — Emergent Google OAuth flow with session management
3. **Dashboard** — Glass-morphism balance card, quick actions grid, inflation shield toggle, recent transactions
4. **Send Money** — 4-step flow: amount → recipient → review → success with animations
5. **Receive Money** — QR code display, copy address, payment request links
6. **Family Vault** — Member cards with allocations, progress bars, add member dialog
7. **DollarFlow Spots** — Leaflet map with CartoDB dark tiles, 25 agent pins, city filters, search
8. **Chat-to-Pay** — Real-time chat with Claude Sonnet 4.5 AI, action cards, payment confirmation
9. **Analytics** — Fee savings counters, spending donut chart, currency trend area chart, comparison bars
10. **Profile/Settings** — Avatar, inflation shield config, country selector, theme toggle, logout

### Backend APIs (15 endpoints)
- Auth: /api/auth/session, /api/auth/me, /api/auth/logout, /api/auth/onboard
- Transactions: GET/POST /api/transactions
- Family Vault: GET /api/family-vault, POST/PUT /api/family-vault/member
- Spots: GET /api/spots (with filters)
- Currencies: GET /api/currencies, GET /api/currencies/history/{currency}
- Analytics: GET /api/analytics
- Inflation Shield: GET/PUT /api/inflation-shield
- Chat: POST /api/chat, GET /api/chat/history
- Settings: PUT /api/settings
- Dashboard: GET /api/dashboard

### Mock Data
- 20 transactions per user (auto-seeded on signup)
- 5 family members with realistic allocations
- 25 spot agents across Manila, Lagos, Buenos Aires
- 5 currencies with historical exchange rate data

## Testing Results
- Backend: 94% pass
- Frontend: 100% pass
- Overall: 97% pass

## Prioritized Backlog

### P0 (Critical for Demo)
- [x] All 10 pages built and functional
- [x] Google OAuth working
- [x] Claude AI Chat-to-Pay working
- [x] Mock data seeded automatically

### P1 (High Value)
- [ ] Real wallet connection with RainbowKit + Wagmi on Base Sepolia
- [ ] Solidity FamilyVault smart contract deployment
- [ ] Real-time transaction tracking on blockchain
- [ ] Onboarding flow (4-step wizard)
- [ ] PWA manifest for mobile install

### P2 (Enhancement)
- [ ] Light mode polish
- [ ] Confetti animation on payment success
- [ ] Payment request link generation
- [ ] Agent "Become an Agent" registration flow
- [ ] Monthly savings report export
- [ ] Push notifications

## Next Tasks
1. Add real wallet connection (RainbowKit + Wagmi + Viem)
2. Deploy FamilyVault.sol smart contract on Base Sepolia
3. Build the 4-step onboarding wizard
4. Add confetti animation on send success
5. Polish light mode theme
