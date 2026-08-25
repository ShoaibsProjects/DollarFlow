# DollarFlow V1 — Demo Script (3-5 Minutes)

## Demo Overview

**Goal**: Demonstrate a non-custodial, testnet-only USDC payment prototype with real on-chain transfers and independent verification.

**Audience**: Technical (developers, product managers, investors)

**Duration**: 3-5 minutes

**Key Message**: "Real blockchain transfers, non-custodial, with independent verification — but testnet only, no real money."

---

## Demo Environment Setup (Pre-Demo)

### 5 Minutes Before
1. Open http://localhost:3000 (frontend)
2. Open http://localhost:8001/docs (backend API docs)
3. Open MetaMask → Base Sepolia selected
4. Verify test ETH + test USDC in wallet
5. Have second test wallet address ready for sending

### Browser Tabs Ready
- Tab 1: http://localhost:3000 (DollarFlow app)
- Tab 2: https://sepolia.basescan.org (block explorer)
- Tab 3: http://localhost:8001/docs (API docs, optional)

---

## Demo Script (Step-by-Step)

### 1. Introduction (30 seconds)

> "This is DollarFlow V1 — a non-custodial USDC payment prototype on Base Sepolia testnet.
> 
> **Key points before we start:**
> - **Testnet only**: Base Sepolia test USDC has no monetary value
> - **Non-custodial**: Your keys stay in your wallet — DollarFlow never sees them
> - **Real blockchain transfers**: We sign and submit actual USDC.transfer() transactions
> - **Independent verification**: Backend checks the chain receipt, doesn't trust the frontend
> 
> Let me show you the full flow."

**Point out**: Persistent testnet banner at top of every page.

---

### 2. Authentication & Wallet Connection (45 seconds)

**Actions**:
1. Click "Get Started — It's Free"
2. Sign in with Google (Emergent OAuth)
3. Land on Dashboard
4. Point out: "Connect Wallet" button in sidebar (desktop) or top bar (mobile)

**Narrative**:
> "First, authentication via Emergent OAuth — standard Google sign-in.
> Now I'll connect my wallet. This uses RainbowKit + Wagmi — standard Web3 wallet connection.
> Notice it auto-prompts to switch to Base Sepolia if needed."

**Actions**:
1. Click wallet connect button
2. Select MetaMask
3. Approve connection
4. Show wallet address appears in sidebar with test USDC balance

**Narrative**:
> "Wallet connected. You can see my test USDC balance — this is real-time from Base Sepolia via eth_call.
> Now I need to prove I own this wallet before sending."

---

### 3. Wallet Ownership Verification (60 seconds)

**Actions**:
1. Click "Verify Wallet" in wallet card
2. Show nonce request → backend returns cryptographically secure nonce
3. Show message template — emphasize: "NOT a blockchain transaction"
4. Click "Sign" → MetaMask prompts for signature
5. Show success → wallet linked

**Narrative**:
> "This is critical — DollarFlow uses SIWE-style signed messages to prove wallet ownership.
> The backend generates a one-time nonce tied to my user session, wallet address, domain, and chain ID.
> 
> **Key point**: This signature proves I control the private key — but it's NOT a blockchain transaction. No gas, no funds moved.
> 
> The backend verifies the signature cryptographically, invalidates the nonce (single-use), and links the wallet to my account.
> 
> Now my wallet is verified and ready for transfers."

**Show**: WalletVerificationCard with linked wallet status.

---

### 4. Send USDC — Create Intent (45 seconds)

**Actions**:
1. Navigate to "Send" page (sidebar)
2. Enter amount: "25.50" (or any amount)
3. Click Continue
4. Select recipient: either saved contact or enter address manually
5. Click Continue to Review

**Narrative**:
> "Now I'll send test USDC. The flow is: Amount → Recipient → Review → Sign.
> 
> Notice the fee: $0.00 platform fee. Only Base Sepolia network gas applies.
> 
> I'll select a recipient — either from my Family Vault contacts or enter an address manually."

**Actions**:
1. If using saved contact: click contact card
2. If manual: enter test wallet address
3. Click Continue → Review step

---

### 5. Safety Review & Acknowledgement (45 seconds)

**Actions**:
1. Show review modal with:
   - Amount + recipient (full + short address)
   - Network: Base Sepolia
   - Token: USDC (testnet)
   - Contract address
   - Gas estimate
   - Intent expiry
   - Policy assessment (CLEAR/REVIEW/BLOCKED)
2. **Critical**: Show safety acknowledgement checkbox
3. Check box → "Confirm & Sign with Wallet" enabled

**Narrative**:
> "Before signing, DollarFlow shows a clear review screen with full transparency:
> - Exact amount and recipient (both shortened and full address)
> - Network, token, contract address
> - Gas estimate and platform fee ($0.00)
> - Policy assessment from our demo compliance layer
> 
> **Most important**: The safety acknowledgement. User must explicitly acknowledge:
> 'I understand this is a testnet-only transfer using tokens with no financial value.'
> 
> This prevents accidental real-money usage and ensures informed consent."

---

### 6. Wallet Signing & Submission (45 seconds)

**Actions**:
1. Click "Confirm & Sign with Wallet"
2. MetaMask opens → shows USDC.transfer() call
3. Confirm in MetaMask
4. Show "Transaction submitted" status
5. Show "Verifying on-chain..." status

**Narrative**:
> "Now the wallet signs the actual USDC.transfer() call. This is a REAL blockchain transaction on Base Sepolia.
> 
> Notice: DollarFlow does NOT submit this transaction. The wallet submits it directly to Base Sepolia RPC.
> DollarFlow only receives the transaction hash.
> 
> Once we have the hash, we submit it to the backend for independent verification."

**Show**: TransactionStatusTimeline — Intent Created → Wallet Signed → Submitted → Confirming...

---

### 7. Independent Backend Verification (60 seconds)

**Actions**:
1. Wait for verification to complete
2. Show "Confirmed" status
2. Click transaction hash → opens BaseScan
3. Show on-chain details match exactly

**Narrative**:
> "This is the key differentiator: **Independent backend verification**.
> 
> The backend:
> 1. Takes the transaction hash from frontend
> 2. Fetches the receipt from Base Sepolia RPC directly
> 3. Parses Transfer events from the receipt logs
> 4. Matches: sender, recipient, amount, token contract, chain ID
> 
> Only if ALL match → CONFIRMED.
> If receipt success but Transfer event doesn't match → EXCEPTION_MISMATCH.
> If receipt failed → FAILED.
> 
> The frontend NEVER determines success — only the backend's independent verification does.
> 
> Let's verify on BaseScan..."

**Actions**:
1. Click transaction hash link → opens sepolia.basescan.org
2. Show: From, To, Value, Token, Block, Status
3. Point out: Matches exactly what we intended

**Narrative**:
> "On BaseScan you can see the exact same details — this is the source of truth.
> The Transfer event shows: from my wallet, to recipient, 25.50 USDC, on Base Sepolia.
> This is cryptographic proof the transfer happened as intended."

---

### 8. Mismatch Scenario (Optional, 30 seconds)

**If time permits**:
1. Show what happens with wrong hash/amount/recipient
2. Show "EXCEPTION_MISMATCH" status
4. Click "Report Issue" → Support page

**Narrative**:
> "If something goes wrong — wrong recipient, wrong amount, different token — the backend catches it.
> Status becomes 'Mismatch' with specific reasons: WRONG_RECIPIENT, WRONG_AMOUNT, etc.
> User can immediately report it via Support."

---

### 9. Receive Page (30 seconds)

**Actions**:
1. Navigate to "Receive" page
2. Show QR code with real wallet address
3. Show copy address button
4. Show payment request link with amount

**Narrative**:
> "Receive page uses your actual verified wallet address — not a generated one.
> QR code for easy scanning, copy button, and payment request links.
> Clear testnet warning: only Base Sepolia test USDC supported."

---

### 10. Transaction History & Audit (30 seconds)

**Actions**:
1. Navigate to "Transactions" page
2. Show list with status badges
3. Click one → detail view with audit timeline
4. Show audit events (hash-chained)

**Narrative**:
> "Full transaction history with verification status badges.
> Each transaction links to detail view with:
> - Intent details vs observed on-chain values
> - Full audit trail (hash-chained, tamper-evident)
> - Policy assessment
> - Support shortcut for mismatches"

---

### 11. Safety Center & Support (30 seconds)

**Actions**:
1. Navigate to "Wallet Security" page
2. Show expandable security topics
3. Navigate to "Support" page
3. Show case creation flow

**Narrative**:
> "Wallet Security center covers: never share seed phrase, verify addresses, testnet tokens no value, transaction status meanings, what to do if rejected/wrong recipient, how to report suspicious activity.
> 
> Support page: create cases, link to transactions, demo complaint workflow.
> All with clear disclaimers: demo only, no financial/legal services."

---

### 12. Closing (30 seconds)

**Summary Points**:
1. **Non-custodial**: Keys in your wallet, never on our servers
2. **Real blockchain**: Actual USDC.transfer() on Base Sepolia
3. **Independent verification**: Backend checks chain, doesn't trust frontend
4. **Audit trail**: Hash-chained, tamper-evident
5. **Testnet only**: No real money, no compliance claims
6. **Clear disclaimers**: Every page, every step

**Q&A**: Open for questions.

---

## Demo Checklist (Pre-Demo Verification)

- [ ] Frontend running at localhost:3000
- [ ] Backend running at localhost:8001
- [ ] MongoDB running
- [ ] MetaMask installed + Base Sepolia added
- [ ] Test ETH in wallet (from Alchemy faucet)
- [ ] Test USDC in wallet (from Circle faucet)
- [ ] Second test wallet address ready for sending
- [ ] Browser tabs ready (app, BaseScan, API docs)
- [ ] Testnet banner visible
- [ ] Wallet connects + shows USDC balance
- [ ] Wallet verification works (nonce + signature)
- [ ] Send flow: amount → recipient → review → sign → verify
- [ ] Verification shows CONFIRMED on BaseScan
- [ ] Receive page shows real wallet address + QR
- [ ] Transactions page shows history with statuses
- [ ] Safety disclaimers visible on all pages
- [ ] Support page creates cases

---

## Common Demo Issues & Fixes

| Issue | Fix |
|-------|-----|
| Wallet won't connect | Check MetaMask on Base Sepolia (chainId 84532) |
| USDC balance 0 | Get test USDC from Circle faucet |
| "Confirming..." stuck | Click "Verify" again; RPC may be slow |
| Verification FAILED | Check test ETH for gas; try again |
| Mismatch WRONG_RECIPIENT | Ensure correct address copied |
| Nonce expired | Click "Verify Wallet" again for new nonce |
| MetaMask popup blocked | Allow popups for localhost:3000 |

---

## Key Talking Points for Q&A

| Question | Answer |
|----------|--------|
| "Is this production ready?" | No — testnet prototype only. No compliance, no real money, no guarantees. |
| "How does verification work?" | Backend fetches receipt from Base Sepolia RPC, parses Transfer events, matches all fields independently. |
| "What if backend is compromised?" | User keys never in backend. Attacker could fake UI but not steal funds — keys in user wallet. |
| "Can this work on Mainnet?" | Architecture supports it, but needs: licenses, compliance, managed RPC, security audit, insurance. |
| "What about gas fees?" | User pays Base Sepolia gas (test ETH). V1 platform fee = $0.00. |
| "How does this compare to Wise/Stripe?" | Different model: blockchain-native, non-custodial, testnet prototype vs regulated fiat rails. |
| "What's the demo compliance layer?" | Illustrative rules only (blocked/review/clear) with mandatory disclaimer — not real KYC/AML. |

---

## Post-Demo Follow-Up

1. Share GitHub repo: https://github.com/ShoaibsProjects/DollarFlow
2. Point to `/docs` folder for full documentation
3. Highlight: ARCHITECTURE.md, SECURITY_MODEL.md, COMPLIANCE_BOUNDARIES.md
4. Mention: Runbook for local setup, Threat Model for security review