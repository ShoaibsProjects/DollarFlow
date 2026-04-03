# DollarFlow — Complete Documentation

> **Your dollars. Everywhere.**
> A decentralized USDC stablecoin payment platform for global workers, freelancers, and travelers in emerging markets.

---

## Table of Contents

1. [What is DollarFlow?](#what-is-dollarflow)
2. [Who is it for?](#who-is-it-for)
3. [Getting Started](#getting-started)
4. [Core Features & How to Use](#core-features--how-to-use)
   - [Dashboard](#1-dashboard)
   - [Send Money](#2-send-money)
   - [Receive Money](#3-receive-money)
   - [Family Vault](#4-family-vault)
   - [DollarFlow Spots (Cash-Out Map)](#5-dollarflow-spots)
   - [Chat-to-Pay](#6-chat-to-pay)
   - [Smart Analytics](#7-smart-analytics)
   - [Inflation Shield](#8-inflation-shield)
   - [Wallet Connection (Web3)](#9-wallet-connection)
   - [Profile & Security](#10-profile--security)
5. [Use Cases — Real-World Scenarios](#use-cases--real-world-scenarios)
6. [Security Features](#security-features)
7. [Technical Architecture](#technical-architecture)
8. [API Reference](#api-reference)
9. [FAQ](#faq)

---

## What is DollarFlow?

DollarFlow is a modern fintech application that makes it easy to send, receive, and manage US dollar stablecoins (USDC) globally. It's designed to feel like a banking app — not a crypto app. Users see "dollars", not "tokens". They see "send", not "transfer on-chain".

### The Problem It Solves

- **$48 billion** is lost to remittance fees annually worldwide
- Western Union charges ~$14 to send $200; banks charge $25-45
- Workers in emerging markets lose 15-47% of their earnings to local currency depreciation
- Existing crypto apps are too complex for non-technical users

### How DollarFlow Is Different

| Feature | Traditional Services | DollarFlow |
|---------|---------------------|------------|
| Fee to send $200 | $14-45 | $0.01-0.03 |
| Transfer speed | 1-5 days | ~15 seconds |
| Currency protection | None | Inflation Shield |
| Family management | None | Family Vault |
| Cash-out network | Limited | DollarFlow Spots |
| Conversational payments | None | Chat-to-Pay |

---

## Who Is It For?

### 1. Migrant Workers
Workers in the US, UK, or Gulf states who send money home to family in the Philippines, Nigeria, Argentina, Kenya, or India. DollarFlow eliminates the $14+ fees they currently pay per transfer.

### 2. Freelancers in Emerging Markets
Developers, designers, and writers who earn in USD but live in countries with depreciating currencies. The Inflation Shield automatically protects their earnings.

### 3. Families Receiving Remittances
Family members back home who need to receive dollars and convert to local cash. The Family Vault gives them their own allocated balance, and DollarFlow Spots shows where to cash out.

### 4. Travelers
People traveling through emerging markets who need quick access to local currency. The Spots map shows nearby cash-out agents with live exchange rates.

### 5. Small Business Owners
Shop owners can register as DollarFlow Spot agents, earning commissions by helping others convert USDC to local cash.

---

## Getting Started

### Step 1: Sign In
1. Visit the DollarFlow landing page
2. Click **"Get Started — It's Free"**
3. Sign in with your Google account (one-click)
4. You're immediately taken to your Dashboard

### Step 2: Explore Your Dashboard
After signing in, you'll see:
- Your **USDC balance** (pre-loaded with mock data for demo)
- **Quick action buttons**: Send, Receive, Convert, Shield
- **Inflation Shield** status
- **Recent transactions**

### Step 3: Connect Your Wallet (Optional)
For on-chain transfers, connect your MetaMask or Coinbase Wallet:
1. Look for the **wallet connect button** in the sidebar (desktop) or top bar (mobile)
2. Click it to open RainbowKit wallet selector
3. Choose your wallet and approve the connection
4. Your on-chain USDC and ETH balances appear on the Dashboard

---

## Core Features & How to Use

### 1. Dashboard

**What it shows:**
- **Balance Card** — Your total USDC balance with glass-morphism effect, equivalent in your local currency
- **On-Chain Wallet Card** — If wallet connected, shows real USDC and ETH balances on Base Sepolia
- **Quick Actions** — Send, Receive, Convert, Shield buttons
- **Inflation Shield Widget** — Toggle on/off, shows how much purchasing power you've preserved
- **Recent Transactions** — Last 7 transactions with smart grouping

**How to use:**
- Tap any quick action to navigate to that feature
- Toggle the Inflation Shield switch to enable/disable auto-conversion
- Tap "View all" to see complete transaction history in Analytics

---

### 2. Send Money

**Three ways to send:**

#### A. Send to a Family Member
1. Navigate to **Send** (quick action or sidebar)
2. Enter the amount (e.g., $50)
3. Tap **Continue**
4. Your **Family Vault members** appear as contacts — tap one
5. Review the transfer details: amount, fee ($0.03), estimated time (~15 sec)
6. If you have a **Transaction PIN** set, enter it when prompted
7. Tap **Confirm & Send**
8. See the success screen with confirmation

#### B. Send to a Custom Address
1. Enter amount and tap Continue
2. Scroll past contacts to the "or enter address" section
3. Paste a wallet address or phone number
4. Review and confirm

#### C. On-Chain USDC Transfer (Wallet Connected)
1. Enter amount and tap Continue
2. Enter a valid Ethereum address (0x...)
3. The review screen shows "On-chain USDC transfer via MetaMask"
4. Tap Confirm — MetaMask opens for signature
5. Wait for on-chain confirmation
6. Success screen shows a **BaseScan link** to the transaction

**Fee structure:**
- In-app transfer: $0.03 flat fee
- On-chain transfer: ~$0.01 (actual Base gas cost)
- Arrives in ~15 seconds

---

### 3. Receive Money

**Three ways to receive:**

#### A. QR Code
1. Navigate to **Receive** (quick action or sidebar)
2. Your QR code is displayed prominently
3. The sender scans it with their DollarFlow app
4. Funds arrive instantly

#### B. Copy Address
1. On the Receive screen, tap **Copy Address**
2. Share the address via any messaging app
3. The sender uses it to send USDC to you

#### C. Request Payment
1. On the Receive screen, scroll to "Request Payment"
2. Enter the amount you want to request (e.g., $50)
3. Tap the share icon to generate and copy a payment request link
4. Send the link to anyone — they click it to pay you

---

### 4. Family Vault

**The most unique feature.** Manage your family's finances from anywhere.

#### Setting Up
1. Navigate to **Family** (sidebar or bottom nav)
2. If it's your first time, you'll see mock family members pre-loaded (Maria/Mom, Carlos/Brother, Ana/Sister, Papa/Dad, Sofia/Daughter)
3. To add a new member, tap **Add Member**
4. Enter their name, relationship, and monthly allocation
5. Tap **Add to Vault**

#### Sending to Family Members
1. On any member's card, tap the **Send** button
2. A dialog appears showing their current balance and allocation
3. Enter the amount
4. If you have a Transaction PIN, enter it
5. Tap **Send $X to [Name]**
6. Their balance updates immediately

#### Monitoring Family Finances
Each member card shows:
- **Current balance** — how much they have available
- **Monthly allocation** — how much you've budgeted for them
- **Progress bar** — percentage of allocation funded
- **Visibility toggle** (eye icon) — family members can turn off spending visibility

#### Vault Summary
The top card shows:
- **Total Balance** — sum of all member balances
- **Monthly Total** — total of all allocations per month

#### Use Case Examples
| Member | Allocation | Purpose |
|--------|-----------|---------|
| Maria (Mom) | $200/month | Groceries |
| Carlos (Brother) | $150/month | School fees |
| Ana (Sister) | $100/month | Bills |
| Papa (Dad) | $175/month | Medicine |
| Sofia (Daughter) | $75/month | Savings |

---

### 5. DollarFlow Spots

**An interactive map of cash-out agents.** Think M-Pesa but for USDC, globally.

#### Using the Map
1. Navigate to **Spots** (sidebar or bottom nav)
2. A full-screen dark map loads showing agent pins
3. Use the **city filter buttons** at top: Manila, Lagos, Buenos Aires, or All Cities
4. Toggle **Open Now** to show only currently open agents
5. Tap any pin on the map to see agent details

#### Searching for Agents
1. Use the **search bar** in the sidebar panel
2. Type an agent name or city
3. Results filter in real-time
4. The count updates (e.g., "18 agents found")

#### Agent Details
Each agent card shows:
- **Name** and location
- **Open/Closed** status (green/red badge)
- **Rating** (star rating, 3.5-5.0)
- **Operating hours**
- **Exchange rate** (e.g., 1 USDC = 56.20 PHP)

#### Coverage
Currently 25 agents across 3 cities:
- **Manila, Philippines** — 10 agents (PHP)
- **Lagos, Nigeria** — 8 agents (NGN)
- **Buenos Aires, Argentina** — 7 agents (ARS)

---

### 6. Chat-to-Pay

**Send money by typing in natural language.** Powered by Claude AI.

#### How It Works
1. Navigate to **Chat** (sidebar or bottom nav)
2. You'll see Flow, your payment assistant
3. Type a command in natural language

#### Supported Commands

| What You Type | What Happens |
|--------------|-------------|
| "Send $50 to Mom" | Creates a $50 transfer to Maria with confirmation card |
| "Send mom 50 bucks" | Same — handles casual language |
| "Split $120 between Alex and Sarah" | Creates two $60 transfers |
| "How much did I spend this week?" | Shows spending summary from recent transactions |
| "Check my balance" | Tells you to check the dashboard |
| "What's my spending?" | Summarizes recent activity |

#### Confirming a Payment
1. After typing a send command, Flow shows an **Action Card**
2. The card displays: recipient, amount, fee
3. Tap **Confirm** to execute the payment
4. Tap **Cancel** to abort
5. Flow confirms: "Done! Payment sent successfully."

#### Quick Suggestions
On first use, suggestion chips appear:
- "Send $50 to Mom"
- "How much did I spend this week?"
- "Split $120 between Alex and Sarah"
- "Check my balance"

Tap any chip to send that message instantly.

#### Tips
- Flow knows your family members by name
- It handles messy typing: "send mom fifty dollars" works
- Messages are limited to 500 characters (security measure)
- Chat history is preserved between sessions

---

### 7. Smart Analytics

**Not just transaction history — intelligent financial insights.**

#### Fee Savings Cards
Three cards showing how much you've saved compared to:
- **Western Union** (avg 6.5% fee)
- **Wise** (avg 2.1% fee)
- **Bank Wire** (avg 8% fee)

All values animate on load with counting effect.

#### Fee Comparison Widget
Visual bar chart comparing the cost of sending $200:
- DollarFlow: $0.03 (tiny bar)
- Wise: $4.20 (small bar)
- Western Union: $14.00 (large bar)

#### Spending by Category
Interactive donut chart breaking down your spending:
- Groceries, School, Bills, Medicine, Savings, Transport, Food, Entertainment

#### Summary Stats
- Total Sent / Total Received
- Total Transactions count
- Total Fees Paid

#### Currency Trend Chart
Area chart showing exchange rate over time:
- Toggle between **ARS** (Argentine Peso), **NGN** (Nigerian Naira), **PHP** (Philippine Peso)
- Time ranges: **7 days**, **30 days**, **90 days**
- Shows how the local currency has depreciated against USD
- Labeled as "estimates based on historical data"

---

### 8. Inflation Shield

**Automatic salary protection against local currency depreciation.**

#### What It Does
When enabled, the Inflation Shield automatically converts incoming funds to USDC, protecting your purchasing power from local currency depreciation.

#### How to Enable
1. **Dashboard**: Toggle the switch on the Inflation Shield widget
2. **Profile > Inflation Shield**: Toggle "Auto-convert to USDC"

#### Configuration
In **Profile > Inflation Shield**:
- **Toggle On/Off** — enable or disable the shield
- **Conversion Percentage** — slider from 10% to 100% (e.g., 70% means 70% of incoming funds auto-convert to USDC, 30% stays in local currency)

#### What You See
When enabled, the Dashboard widget shows:
- Green shield icon with "Protecting your earnings"
- Historical comparison: e.g., "If you held Argentine Pesos for 6 months, you'd have lost 47.2%. With DollarFlow Shield, you'd have lost 0.1%."
- Money saved counter

#### Real Impact by Country
| Country | 6-Month Depreciation | With Shield |
|---------|---------------------|-------------|
| Argentina (ARS) | -47.2% | -0.1% |
| Nigeria (NGN) | -18.5% | -0.1% |
| Kenya (KES) | -5.8% | -0.1% |
| Philippines (PHP) | -3.2% | -0.1% |
| India (INR) | -1.5% | -0.1% |

---

### 9. Wallet Connection

**Real blockchain integration on Base Sepolia testnet.**

#### Connecting Your Wallet
1. Look for the **wallet button** in the sidebar (desktop) or top bar (mobile)
2. Click to open the RainbowKit wallet selector
3. Supported wallets: **MetaMask**, **Coinbase Wallet**, **WalletConnect**
4. Approve the connection in your wallet

#### What Changes After Connecting
- **Dashboard**: Shows an "On-Chain Balance" card with your real USDC and ETH balances
- **Send Money**: When entering a 0x address, the transfer happens on-chain via MetaMask signing
- **Success Screen**: Shows a clickable link to the transaction on BaseScan

#### Network Details
- **Chain**: Base Sepolia (Coinbase Layer 2 testnet)
- **USDC Contract**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Block time**: ~2 seconds
- **Gas fees**: <$0.01

#### Getting Testnet Funds
To test on-chain transfers, you need testnet ETH and USDC:
1. Get Base Sepolia ETH from a faucet (search "Base Sepolia faucet")
2. Get testnet USDC from the USDC faucet or swap on a testnet DEX

---

### 10. Profile & Security

#### Account Information
- Profile picture (from Google account)
- Name and email
- Displays at the top of the Profile page

#### Transaction PIN
**Most important security feature.** When set, every send requires PIN confirmation.

Setting a PIN:
1. Go to **Profile**
2. Find "Transaction PIN" row (shows red "Off" or green "Active")
3. Tap it to open the PIN dialog
4. Enter a 4-6 digit numeric PIN
5. Confirm it
6. Tap **Set PIN**

Using the PIN:
- Every time you send money (Send page or Family Vault), a PIN prompt appears
- Enter your PIN and tap **Confirm** to proceed
- Wrong PIN = transaction blocked

Removing the PIN:
1. Go to Profile > Transaction PIN
2. Enter your current PIN
3. Tap **Remove PIN**

#### Inflation Shield Settings
- Toggle on/off
- Adjust conversion percentage (10-100%)

#### Country & Currency
- Select your home country from: Philippines, Nigeria, Argentina, Kenya, India, US
- This sets your primary currency for local equivalents

#### Theme Toggle
- **Dark Mode** (default) — premium fintech aesthetic
- **Light Mode** — switch via the toggle in Profile, sidebar, or mobile top bar
- Persists across sessions (saved in localStorage)

#### Connected Wallets
- View and manage your blockchain wallet connections

#### Sign Out
- Tap "Sign Out" at the bottom of Profile
- Clears your session securely

---

## Use Cases — Real-World Scenarios

### Scenario 1: Filipino Nurse in London Sending Money Home

**Angela** is a nurse in London. She earns in GBP and needs to send $200/month to her mom in Manila for groceries.

1. Angela signs into DollarFlow with Google
2. Goes to **Family Vault** and sees Maria (Mom) with $200/month allocation
3. Taps **Send** on Maria's card, enters $200
4. Enters her Transaction PIN
5. $200 arrives in Maria's sub-wallet in 15 seconds for $0.03 fee
6. Maria opens the **Spots** map, finds "Makati Cash Hub" (4.9 rating, 56.25 PHP per USDC)
7. Maria walks to the agent and converts her USDC to Philippine Pesos
8. Angela checks **Analytics** — she's saved $167 vs Western Union this year

**Total time**: 2 minutes. **Fee**: $0.03. **Traditional**: $14 and 3 days.

---

### Scenario 2: Nigerian Freelancer Protecting Earnings

**Emeka** is a freelance developer in Lagos. He earns $3,000/month from US clients but the Nigerian Naira has lost 18.5% in 6 months.

1. Emeka enables **Inflation Shield** at 80% conversion
2. When clients pay him, 80% auto-converts to USDC, 20% stays in Naira
3. Over 6 months, he checks Analytics — without the shield, he'd have lost $555 to depreciation
4. With the shield, he lost only $3 (0.1% USDC fluctuation)
5. When he needs Naira for rent, he goes to **Spots** and finds "VI Money Point" in Lagos
6. He uses **Chat-to-Pay**: types "send 50000 naira equivalent to landlord"
7. Flow parses and executes the transfer

**Money saved**: $552 in purchasing power over 6 months.

---

### Scenario 3: Argentine Designer Managing Family Finances

**Valentina** is a graphic designer in Buenos Aires. She earns in USD from international clients and supports her family.

1. Valentina sets up **Family Vault** with:
   - Papa: $175/month for medicine
   - Carlos (brother): $150/month for school
   - Mom: $200/month for groceries
2. Each month, she taps Send on each card and funds their allocations
3. Her family members each have their own balance and can spend independently
4. Papa goes to "Cambio Palermo" (rated 4.9) to convert USDC to ARS for medicine
5. Valentina checks the **Activity Feed** — Papa spent $45 at the pharmacy
6. She checks **Analytics** — the Argentine Peso dropped 47% in 6 months, but her USDC held value
7. The **fee comparison** shows she's saved $168 vs Western Union this year

---

### Scenario 4: Quick Split Between Friends

**Three friends** had dinner for $120 and want to split the bill.

1. Priya opens **Chat-to-Pay**
2. Types: "Split $120 between Alex and Sarah"
3. Flow responds: "Got it! Splitting $120 — $60 to Alex, $60 to Sarah"
4. An action card shows both transfers
5. Priya taps **Confirm**
6. Both Alex and Sarah receive $60 in their DollarFlow accounts
7. Total fee: $0.06 (two transfers at $0.03 each)

---

### Scenario 5: Traveler Needing Local Cash

**James** is a British traveler visiting Buenos Aires. He has USDC in his DollarFlow account.

1. James opens **Spots** and taps "Buenos Aires" filter
2. He sees 7 agents, toggles "Open Now" to filter to 5
3. He finds "Dollar Blue Express" — 0.8km away, rated 4.7, exchange rate 1245 ARS per USDC
4. He walks there, shows his DollarFlow QR code
5. Sends $100 to the agent's address
6. Receives 124,500 Argentine Pesos in cash
7. Total fee: $0.03 + agent's rate spread

---

### Scenario 6: On-Chain Power User

**David** is a crypto-native user who wants to send USDC directly on-chain.

1. David connects his MetaMask wallet via the sidebar button
2. His Dashboard shows: "On-Chain Balance — 150.00 USDC, 0.0245 ETH"
3. Goes to **Send**, enters $50
4. Pastes his friend's Ethereum address: `0x742d35Cc6634C0532925a3b844Bc9e7595f1a2B7`
5. Review screen shows: "On-chain USDC transfer via MetaMask — Base Sepolia network"
6. Taps Confirm — MetaMask popup appears for transaction signing
7. Waits ~15 seconds for confirmation
8. Success screen shows a clickable **BaseScan link** to verify the transaction

---

## Security Features

### Authentication
- **Google OAuth** via Emergent Auth — no passwords to remember or leak
- **Session tokens** with 7-day expiry, stored as httpOnly secure cookies
- **Session cleanup** endpoint to purge expired sessions

### Transaction Security
- **Transaction PIN** — 4-6 digit PIN hashed with SHA-256, required for all sends
- **Rate limiting** — prevents brute force:
  - Auth: 10 requests/minute
  - Transactions: 30 requests/minute
  - Family sends: 20 requests/minute
  - Chat: 15 requests/minute (also saves LLM credits)
- **Amount validation** — minimum $0.01, maximum $50,000

### Data Security
- **Input sanitization** — all user inputs stripped of HTML/XSS via `html.escape()`
- **MongoDB injection prevention** — regex inputs escaped with `re.escape()`
- **Pydantic validation** — strict type checking on all API inputs
- **String length limits** — prevents buffer overflow-style attacks
- **Chat message limit** — 500 characters max

### HTTP Security Headers
Every response includes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (prevents clickjacking)
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Wallet Security
- **Non-custodial** — DollarFlow never holds your private keys
- On-chain transactions require MetaMask signing — no one can send without your approval
- Wallet connection uses industry-standard WalletConnect/RainbowKit

---

## Technical Architecture

```
Frontend (React)                    Backend (FastAPI)                 Database (MongoDB)
├── Landing Page                    ├── Auth (Google OAuth)           ├── users
├── Dashboard                       ├── Transactions CRUD            ├── user_sessions
├── Send Money                      ├── Family Vault                 ├── transactions
├── Receive Money                   ├── Spots (mock agents)          ├── family_vaults
├── Family Vault                    ├── Chat-to-Pay (Claude AI)      ├── family_members
├── Spots (Leaflet Map)             ├── Analytics                    └── chat_messages
├── Chat-to-Pay                     ├── Inflation Shield
├── Analytics (Recharts)            ├── Live Fees (Wise + Base RPC)
├── Profile/Settings                └── Security (PIN, rate limit)
└── Web3 (RainbowKit/Wagmi/Viem)
```

### Live Data Sources
| Data | Source | Update Frequency |
|------|--------|-----------------|
| DollarFlow gas fee | Base Sepolia RPC (`eth_gasPrice`) | Real-time, 60s cache |
| Wise transfer fee | `api.wise.com/v3/quotes` | Real-time, 60s cache |
| Exchange rates | Mock data based on real rates | Static (refreshable) |
| Agent locations | 25 hardcoded spots | Static |

---

## API Reference

### Public Endpoints (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spots` | List all cash-out agents (filter: `city`, `currency`, `open_now`) |
| GET | `/api/currencies` | Current exchange rates for PHP, NGN, ARS, KES, INR |
| GET | `/api/currencies/history/{code}` | 12-month historical rates (ARS, NGN, PHP) |
| GET | `/api/fees/live` | Live fee comparison: DollarFlow vs Wise vs WU vs banks |

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/session` | Exchange Google OAuth session_id for app session |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/logout` | End session |
| PUT | `/api/auth/onboard` | Set country, currency, use case |

### Protected Endpoints (Require Session)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Balance, recent transactions, shield status |
| GET | `/api/transactions` | All user transactions |
| POST | `/api/transactions` | Create a transaction (supports PIN) |
| GET | `/api/family-vault` | Vault + all members |
| POST | `/api/family-vault/member` | Add a family member |
| PUT | `/api/family-vault/member/{id}` | Update member settings |
| POST | `/api/family-vault/send/{id}` | Send funds to a member (supports PIN) |
| POST | `/api/chat` | Send message to Flow AI assistant |
| GET | `/api/chat/history` | Chat message history |
| GET | `/api/analytics` | Fee savings, spending breakdown |
| GET | `/api/inflation-shield` | Shield status and savings |
| PUT | `/api/inflation-shield` | Toggle shield on/off |
| PUT | `/api/settings` | Update user preferences |
| POST | `/api/security/pin` | Set transaction PIN |
| GET | `/api/security/pin/status` | Check if PIN is set |
| DELETE | `/api/security/pin` | Remove PIN (requires current PIN) |
| POST | `/api/security/sessions/cleanup` | Purge expired sessions |

---

## FAQ

**Q: Is this a real banking app?**
A: DollarFlow is a production-quality prototype. The UI, API, and security features are real. On-chain transactions work on Base Sepolia testnet. Mock data is used for demo purposes (agent locations, historical rates).

**Q: Do I need a crypto wallet?**
A: No. You can use DollarFlow entirely through the web interface with Google sign-in. Wallet connection is optional for users who want on-chain USDC transfers.

**Q: What blockchain does it use?**
A: Base (Coinbase Layer 2) — specifically Base Sepolia testnet for this prototype. Base is chosen for its low gas fees (~$0.01) and fast block times (~2 seconds).

**Q: Is it non-custodial?**
A: Yes. DollarFlow never holds your private keys. On-chain transactions are signed by your own wallet. The app-level balance is managed through the database for the prototype.

**Q: How does the Chat-to-Pay work?**
A: It uses Claude Sonnet 4.5 (Anthropic's latest AI model) to parse natural language payment commands. You type "send $50 to Mom" and it creates a structured transaction for you to confirm.

**Q: What currencies are supported?**
A: USDC as the base currency. Local currency display for PHP (Philippines), NGN (Nigeria), ARS (Argentina), KES (Kenya), INR (India), and USD.

**Q: Can I use this on mobile?**
A: Yes. DollarFlow is fully responsive — designed mobile-first at 375px, scales to tablet (768px) and desktop (1280px). Bottom navigation on mobile, sidebar on desktop.

**Q: How is the fee comparison live?**
A: DollarFlow fees are computed from the actual Base network gas price via RPC. Wise fees are pulled from their public API (`api.wise.com/v3/quotes`). Western Union and bank fees are industry-standard estimates.

**Q: What if I forget my Transaction PIN?**
A: Currently there's no self-service PIN reset — contact support. This is by design for security. A future update will add PIN recovery via email verification.

---

*Built with React, FastAPI, MongoDB, Tailwind CSS, Framer Motion, RainbowKit, Wagmi, Viem, Leaflet, Recharts, Claude Sonnet 4.5, and Emergent Auth.*

*DollarFlow 2026. Your dollars. Everywhere.*
