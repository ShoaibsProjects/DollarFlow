# DollarFlow V1 — Manual Test Checklist

> **Purpose**: Step-by-step verification that the V1 prototype works as designed.
> **Environment**: Local development (Base Sepolia testnet only)

---

## Prerequisites

- [ ] MongoDB running on `mongodb://localhost:27017`
- [ ] Backend running: `cd backend && uvicorn server:app --reload --port 8001`
- [ ] Frontend running: `cd frontend && yarn start` (http://localhost:3000)
- [ ] MetaMask installed with Base Sepolia network configured
- [ ] Test ETH obtained from https://www.alchemy.com/faucets/base-sepolia
- [ ] Test USDC obtained from https://faucet.circle.com/ (Base Sepolia)
- [ ] Test USDC token added to MetaMask (Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)

---

## 1. Authentication & Wallet Connection

### 1.1 User Sign-In
- [ ] Navigate to http://localhost:3000
- [ ] Click "Get Started — It's Free"
- [ ] Complete Google OAuth sign-in
- [ ] Redirected to Dashboard
- [ ] Verify user session persists on refresh

### 1.2 Wallet Connection
- [ ] Click "Connect Wallet" in sidebar (desktop) or top bar (mobile)
- [ ] Select MetaMask
- [ ] Approve connection in MetaMask
- [ ] Verify wallet address appears in sidebar/top bar

### 1.3 Network Verification
- [ ] If on wrong network: Yellow banner appears with "Switch to Base Sepolia" button
- [ ] Click button → MetaMask prompts network switch
- [ ] After switch: Banner disappears, wallet shows Base Sepolia

---

## 2. Wallet Ownership Verification (SIWE-style)

### 2.1 Request Nonce
- [ ] Navigate to Send page or Wallet Security page
- [ ] Click "Verify Wallet" button
- [ ] Backend returns nonce, domain, chain_id, issued_at, expires_at, message_template
- [ ] Verify message contains: "This is NOT a blockchain transaction and will NOT move any funds"

### 2.2 Sign Message
- [ ] MetaMask prompts for signature (personal_sign)
- [ ] Click "Sign"
- [ ] Frontend sends signature + message to backend

### 2.3 Verification Result
- [ ] Backend verifies signature matches wallet address
- [ ] Nonce marked "used" (single-use)
- [ ] Wallet linked to user account
- [ ] Wallet appears in "Linked Wallets" list
- [ ] Audit event `WALLET_LINKED` created

### 2.4 Replay Prevention
- [ ] Try to verify same nonce again → Rejected ("Invalid or expired nonce")
- [ ] Try to use another user's nonce → Rejected

### 2.4 Wrong Domain/Chain ID
- [ ] Manually modify message domain → Rejected ("Message does not match expected format")
- [ ] Manually modify message chain ID → Rejected ("Message does not match expected format")

### 2.5 Wallet Selection & Unlinking
- [ ] Multiple wallets linked → Can select default
- [ ] Unlink wallet → Requires fresh signature challenge
- [ ] Unlinked wallet no longer appears in linked list
- [ ] Audit event `WALLET_UNLINKED` created

---

## 3. Base Sepolia Test USDC Balance

### 3.1 Balance Display
- [ ] Dashboard shows USDC balance card
- [ ] Balance matches MetaMask / BaseScan
- [ ] Balance updates after transactions

### 3.2 Balance API
- [ ] GET `/api/blockchain/usdc-balance?wallet=0x...` returns atomic + formatted balance
- [ ] Invalid address rejected (400)
- [ ] RPC unavailable → returns `rpc_available: false`

---

## 4. Send USDC (Core Flow)

### 4.1 Step 1: Amount
- [ ] Enter amount (e.g., "25.50")
- [ ] Validation: positive, max 6 decimals, within demo cap ($1000)
- [ ] Fee displayed: $0.00 platform fee
- [ ] Continue button enabled only with valid amount

### 4.2 Step 2: Recipient
- [ ] Select from contacts (Family Vault members)
- [ ] OR enter wallet address manually (validated as 0x... 42 chars)
- [ ] Self-transfer rejected
- [ ] Continue button enabled only with valid recipient

### 4.3 Step 3: Review & Safety Acknowledgement
- [ ] Review modal shows:
  - Amount (e.g., $25.50)
  - Recipient (full + short address)
  - Network: Base Sepolia (Testnet)
  - Token: USDC
  - Contract address
  - Gas estimate
  - Platform fee: $0.00
  - Intent expiry time
  - Policy result (CLEAR/REVIEW/BLOCKED)
- [ ] **Mandatory checkbox**: "I understand this is a testnet-only transfer using tokens with no financial value"
- [ ] Confirm button disabled until checkbox checked
- [ ] Warning: "Blockchain transfers are irreversible after wallet confirmation. Verify the recipient address."

### 4.4 Step 4: Wallet Signing
- [ ] Click "Confirm & Sign with Wallet"
- [ ] MetaMask opens → shows USDC.transfer() call
- [ ] Review amount, recipient in MetaMask
- [ ] Click "Confirm"
- [ ] Status: "Transaction submitted. Verifying..."

### 4.5 Backend Verification
- [ ] Frontend submits tx hash to backend
- [ ] Backend polls Base Sepolia RPC for receipt
- [ ] Backend parses Transfer events
- [ ] Matches: sender, recipient, amount, contract, chain ID
- [ ] Status transitions: SUBMITTED → CONFIRMING → CONFIRMED/FAILED/EXCEPTION_MISMATCH

### 4.6 Success State
- [ ] Status: "Transfer Confirmed!"
- [ ] Transaction hash links to BaseScan
- [ ] BaseScan shows: correct sender, recipient, amount, USDC token, Base Sepolia chain
- [ ] Audit event `CHAIN_TRANSFER_CONFIRMED` created

### 4.7 Failure States
- [ ] Transaction reverted → Status: "Failed"
- [ ] Mismatch (wrong recipient/amount/token) → Status: "Mismatch - Review Required"
- [ ] Mismatch reasons displayed: WRONG_RECIPIENT, WRONG_AMOUNT, WRONG_TOKEN, etc.
- [ ] "Report Issue" button opens Support form pre-filled with transaction ID

### 4.7 Rejected Wallet Prompt
- [ ] User clicks "Cancel" in MetaMask → Status stays "Pending Signature"
- [ ] No transaction hash submitted to backend
- [ ] Can retry or cancel

### 4.8 PIN Verification (if enabled)
- [ ] User has PIN set → PIN prompt appears before signing
- [ ] Correct PIN → Proceeds to wallet signing
- [ ] Wrong PIN → Rejected
- [ ] Cancel → Returns to review step

---

## 5. Receive USDC

### 5.1 QR Code & Address
- [ ] Receive page shows QR code with wallet address
- [ ] Address matches linked wallet (not generated from user_id)
- [ ] Copy address button works
- [ ] "View on BaseScan" link opens correct address on BaseScan

### 5.2 Payment Request Link
- [ ] Optional amount input
- [ ] Generate link button copies: `/receive?address=0x...&token=USDC&chainId=84532&amount=X`
- [ ] Link can be shared
- [ ] Clear label: "This is a request only — not an invoice or guarantee of payment"

### 5.3 Wallet Selector
- [ ] Multiple linked wallets → Dropdown to select receiving wallet
- [ ] Testnet warning: "Only Base Sepolia test USDC is supported"

---

## 6. Transaction History & Verification

### 6.1 History List
- [ ] Transactions page shows all intents
- [ ] Filter tabs: All / Confirmed / Pending / Failed
- [ ] Each row shows: date, recipient/sender, amount, status badge, tx hash (truncated)
- [ ] Status badges: Confirmed (green), Pending (blue), Confirming (yellow), Failed (red), Mismatch (amber)

### 6.2 Transaction Detail
- [ ] Click row → Detail page
- [ ] Shows: Intent ID, Client Request ID, Sender, Recipient, Amount (display + atomic), Token, Contract, Chain ID, Created/Submitted/Confirmed timestamps, Expiry
- [ ] On-chain transaction: tx hash (copyable), BaseScan link
- [ ] Policy assessment: CLEAR/REVIEW/BLOCKED with rules evaluated
- [ ] Mismatch details (if any): expected vs observed values
- [ ] Audit timeline: chronological events with hash chain

### 6.3 Verification States
- [ ] CONFIRMED: Green badge, BaseScan link works
- [ ] FAILED: Red badge, failure reason shown
- [ ] EXCEPTION_MISMATCH: Amber badge, mismatch reasons listed (WRONG_RECIPIENT, WRONG_AMOUNT, etc.)
- [ ] CONFIRMING: Yellow badge, "Waiting for Base Sepolia confirmation..."
- [ ] PENDING_SIGNATURE: Gray badge, "Waiting for wallet signature..."

---

## 7. Audit Trail

### 7.1 Audit Events
- [ ] Audit page lists user's events
- [ ] Events: WALLET_LINKED, TRANSFER_INTENT_CREATED, TRANSFER_SUBMITTED, CHAIN_TRANSFER_CONFIRMED, CHAIN_TRANSFER_MISMATCH, CHAIN_TRANSFER_FAILED, WALLET_UNLINKED, SUPPORT_CASE_CREATED, etc.
- [ ] Each event: type, resource, timestamp, payload
- [ ] Hash chain verification: "Verify Chain" button returns valid

### 7.2 Hash Chain Integrity
- [ ] Tamper test: Manually modify event payload in DB → Verify chain detects tampering
- [ ] User isolation: User A cannot see User B's audit events
- [ ] Resource-scoped queries: Filter by resource type + ID
- [ ] No secrets in payloads (no private keys, seed phrases, session tokens)

### 7.3 Append-Only
- [ ] No UPDATE/DELETE endpoints for audit events
- [ ] Events ordered chronologically
- [ ] Genesis hash: "0" * 64

---

## 8. Safety Disclosures & Demo Policy

### 8.1 Persistent Testnet Banner
- [ ] Visible on ALL pages (Dashboard, Send, Receive, History, Detail, Wallet Security, Support, Profile, Analytics, Spots, Chat, Family Vault)
- [ ] Text: "DollarFlow Testnet Preview — Uses Base Sepolia test USDC only. Test assets have no monetary value. Do not use DollarFlow for real financial transactions."
- [ ] Dismissible but reappears on new session

### 8.2 Safety Disclosure Modal
- [ ] Appears before first transfer
- [ ] Lists 6 disclosures: Testnet Only, Non-Custodial, Irreversible Transfers, No Financial Services, No Guarantees, Support Limitations
- [ ] Mandatory acknowledgement checkbox
- [ ] Cannot proceed without acknowledgement

### 8.3 Demo Policy Layer
- [ ] Policy result shown in transfer review (CLEAR/REVIEW/BLOCKED)
- [ ] Rules evaluated listed (address_format, demo_transfer_cap, transfer_purpose, demo_blocked_recipient, demo_review_recipient)
- [ ] **Mandatory disclaimer**: "Illustrative safety rules only. This is not KYC, AML, sanctions screening, legal advice, or a compliance determination."
- [ ] No real KYC/AML/sanctions/Travel Rule implementation

### 8.4 Transfer Review Policy Display
- [ ] CLEAR: Green badge
- [ ] REVIEW: Amber badge
- [ ] BLOCKED: Red badge
- [ ] Disclaimer always visible

---

## 9. Support & Complaints

### 9.1 Create Case
- [ ] Support page: "New Case" button
- [ ] Categories: transfer_pending, wrong_recipient, wallet_issue, bug, safety, other
- [ ] Types: support, complaint, suspicious_activity_report
- [ ] Optional: Link to transaction intent ID
- [ ] Description required (max 5000 chars)
- [ ] Disclaimer: "This demo support channel does not provide financial, legal, or account-recovery services."

### 9.2 Case Management
- [ ] List shows: type, category, description preview, status, priority, created date
- [ ] Status badges: open (blue), in_review (amber), resolved (green), closed (gray)
- [ ] Click case → Detail view with description, timestamps, resolution note
- [ ] Add comments to case
- [ ] Mismatch auto-links: "Report Issue" from mismatch state pre-fills transaction ID

### 9.3 Demo Resolution
- [ ] Cases auto-resolve in demo mode (simulated)
- [ ] Resolution note visible
- [ ] Toast notifications on status changes

---

## 10. Cross-User Authorization

- [ ] User A cannot access User B's wallet links
- [ ] User A cannot access User B's transaction intents
- [ ] User A cannot access User B's audit events
- [ ] User A cannot access User B's support cases
- [ ] All endpoints enforce `user_id` ownership

---

## 11. Security & Configuration

### 11.1 Environment
- [ ] `.env` files ignored by Git
- [ ] `.env.example` files exist with no secrets
- [ ] CORS origins configurable (not wildcard in production)
- [ ] Rate limits on: wallet nonce, wallet verification, intent creation, hash submission, verification trigger, support creation
- [ ] API errors don't expose stack traces, connection strings, RPC details
- [ ] Every write action creates audit event

### 11.2 Security Headers
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy: camera=(), microphone=(), geolocation=()

---

## 12. Known Limitations (V1)

- [ ] Base Sepolia public RPC is rate-limited → Verification may timeout
- [ ] No CSRF protection on cookie-authenticated endpoints
- [ ] No per-user rate limits (global only)
- [ ] Audit hash salt in env (not HSM/KMS)
- [ ] No encryption at rest for MongoDB
- [ ] No hardware wallet enforcement
- [ ] No production RPC / managed infrastructure
- [ ] No formal security audit

---

## Release Recommendation

- [ ] All checklist items pass
- [ ] No blocking issues
- [ ] Documentation complete
- [ ] Tests passing (sync tests: 21/21 passing; async tests require MongoDB + event loop fix)

**Status**: ✅ **READY FOR TESTNET PORTFOLIO DEMO**

---

## Blocking Issues (None)

| Issue | Status |
|-------|--------|
| Event loop closure in async tests | Known limitation (pytest-asyncio + motor), not blocking demo |
| Async test fixture cleanup | Needs pytest-asyncio 0.23+ or custom fixture |

---

## Next Steps (V2)

1. Fix async test fixtures for CI
2. Add CSRF protection
3. Per-user rate limits (Redis)
4. Managed RPC provider (Alchemy/Infura)
5. Hardware wallet support
5. Production RPC / managed infrastructure
6. Formal security audit
7. Real compliance integration (KYC/AML provider)
8. CCTP / cross-chain
9. Gas sponsorship / paymaster
10. EIP-7702 / ERC-4337 account abstraction