# DollarFlow V1 — Disclosures and Consumer Safety

## Testnet Disclaimer

**Displayed on every page:**
> **DollarFlow Testnet Preview** — Uses Base Sepolia test USDC only. Test assets have no monetary value. Do not use DollarFlow for real financial transactions.

### What This Means
- Base Sepolia is a **test network** — not real Ethereum/Mainnet
- Test USDC has **zero monetary value** — cannot be exchanged for real USDC, USD, or goods
- Transactions are **real on-chain** but with **test assets only**
- No financial gain or loss is possible

## Finality and Recipient Address Warning

**Displayed before every transfer:**
> Blockchain transfers can be irreversible after wallet confirmation. Verify the recipient address.

### What This Means
- Once you confirm in your wallet, the transfer **cannot be reversed by DollarFlow**
- No "undo" button, no chargeback, no customer support reversal
- If you send to the wrong address, **the funds are gone** (even on testnet)
- Always verify: first 6 chars + last 4 chars minimum
- Use QR codes or copy/paste — never type manually

## Gas and Fee Display

### What You Pay
| Fee Type | Amount | Who Receives |
|----------|--------|--------------|
| DollarFlow Platform Fee | **$0.00** | DollarFlow (none in V1) |
| Base Sepolia Network Fee (Gas) | ~0.000001–0.0001 ETH | Base validators |
| USDC Transfer Fee | **Included in gas** | N/A |

### Gas Estimation
- Shown in review modal before signing
- Actual gas may vary slightly
- You need test ETH in your wallet for gas
- Get test ETH: https://www.alchemy.com/faucets/base-sepolia

## Transaction Status Meanings

| Status | Meaning | User Action |
|--------|---------|-------------|
| **Pending Signature** | Waiting for you to sign in wallet | Sign in MetaMask/wallet |
| **Submitted** | Tx sent to Base Sepolia, waiting for verification | Wait |
| **Confirming...** | Backend verifying receipt + Transfer event | Wait |
| **Confirmed** | Transfer verified on-chain — matches intent exactly | Done |
| **Failed** | Transaction reverted or verification timeout | Check error, retry |
| **Mismatch** | On-chain tx doesn't match expected details | Review mismatch details, contact support |
| **Expired** | Intent expired before submission | Create new intent |
| **Cancelled** | Cancelled before submission | Create new intent |

## Support and Complaint Intake

### What You Can Report
- Transfer stuck in "Confirming..." for >5 minutes
- Verification shows "Mismatch" with details
- Wallet connection/verification issues
- Suspicious wallet addresses or phishing attempts
- Bugs or technical issues

### What Support CANNOT Do
- ❌ Reverse confirmed blockchain transactions
- ❌ Recover funds sent to wrong address
- ❌ Provide financial, legal, or tax advice
- ❌ Perform account recovery (non-custodial = no account)
- ❌ Guarantee transaction speed or finality
- ❌ Provide real KYC/AML/sanctions decisions

### Complaint Process
1. Submit case via Support page
2. Include transaction intent ID if related to transfer
3. Cases reviewed in demo mode (no SLA)
4. Resolution noted in case history

## Prohibited Claims

**DollarFlow V1 does NOT claim to be:**
- A bank, credit union, or depository institution
- A money transmitter, remittance service, or payment processor
- A cryptocurrency exchange or trading platform
- A wallet custodian or key management service
- A licensed or regulated financial entity
- Compliant with KYC, AML, sanctions, Travel Rule, or any regulation
- Offering investment, savings, or yield products
- Providing consumer protection (FDIC, SIPC, etc.)

## No Real-Money or Investment Language

### Prohibited Terms in V1
- "Earn interest", "yield", "APY", "returns"
- "Invest", "investment", "portfolio"
- "Insured", "guaranteed", "protected"
- "Licensed", "regulated", "compliant"
- "Bank-grade", "institutional", "enterprise"
- "Real-time settlement" (without "testnet" qualifier)

### Acceptable Language
- "Testnet prototype"
- "Base Sepolia test USDC"
- "Non-custodial demonstration"
- "Educational/demo purposes only"
- "No financial value"

## Consumer Safety Checklist

Before using DollarFlow V1, verify you understand:

- [ ] This is **testnet only** — no real money involved
- [ ] Test USDC **cannot be converted** to real USDC or cash
- [ ] I hold my **own private keys** — DollarFlow never sees them
- [ ] Transfers are **irreversible** after wallet confirmation
- [ ] I must **verify recipient address** before signing
- [ ] Gas fees require **test ETH** (free from faucet)
- [ ] No **account recovery** exists — lose keys = lose access
- [ ] No **regulatory protection** — not a financial service
- [ ] **Support is demo only** — no real dispute resolution

## Phishing and Scam Awareness

### DollarFlow Will NEVER:
- Ask for your seed phrase / recovery phrase
- Ask for your private key
- Ask you to "verify" by sending funds
- Send you DMs with wallet links
- Offer "free USDC" or "airdrop" requiring signature
- Ask for wallet JSON/keystore upload

### Report Suspicious Activity
If you encounter:
- Fake DollarFlow websites (check URL: localhost:3000 or official domain)
- DMs claiming to be DollarFlow support
- Wallet connection requests from unknown sites
- "Security alerts" asking for seed phrase

**Use the Support page → "Suspicious Activity Report"**

## Summary

| You Are Responsible For | DollarFlow V1 Provides |
|------------------------|------------------------|
| Private key security | Non-custodial wallet integration |
| Address verification | Clear review screen with warnings |
| Test ETH for gas | Free faucet links |
| Understanding irreversibility | Explicit confirmations + status tracking |
| Reporting issues | Demo support channel |
| Legal/tax compliance | None (testnet only) |

**Remember: This is a prototype for learning and demonstration. No real money. No real compliance. No guarantees.**