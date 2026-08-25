# DollarFlow V1 — Compliance Boundaries

## This App Is Not a Compliance Product

**DollarFlow V1 is a prototype/demo application only.** It does not implement, provide, or claim any regulatory compliance capabilities.

### What This Means

| Statement | True/False |
|-----------|------------|
| DollarFlow V1 performs KYC | ❌ False |
| DollarFlow V1 performs AML screening | ❌ False |
| DollarFlow V1 checks sanctions lists | ❌ False |
| DollarFlow V1 implements Travel Rule | ❌ False |
| DollarFlow V1 is a licensed money transmitter | ❌ False |
| DollarFlow V1 provides banking services | ❌ False |
| DollarFlow V1 offers custodial accounts | ❌ False |
| DollarFlow V1 guarantees regulatory compliance | ❌ False |

## What V1 Actually Implements

### Illustrative Demo Policy Layer

A clearly named `DemoCompliancePolicyService` with deterministic, **illustrative** rules:

| Rule | Outcome | Purpose |
|------|---------|---------|
| Malformed wallet address | BLOCKED | Input validation demo |
| Amount > $1,000 demo cap | REVIEW | Limit demonstration |
| Recipient in seeded blocked list | BLOCKED | List screening demo |
| Recipient in seeded review list | REVIEW | List screening demo |
| Missing transfer purpose | REVIEW | Data completeness demo |
| Valid small transfer | CLEAR | Happy path |

### Mandatory Disclaimer

**Every policy response includes:**

> "Illustrative safety rules only. This is not KYC, AML, sanctions screening, legal advice, or a compliance determination."

This disclaimer appears in:
- API responses from `/api/compliance-demo/assess`
- Frontend UI when policy result is shown
- Transaction review modal
- Documentation

## Why This Is Not Real Compliance

| Real Compliance Requirement | V1 Implementation | Gap |
|----------------------------|-------------------|-----|
| KYC (identity verification) | None | No document collection, no identity proofing |
| AML (transaction monitoring) | None | No SAR filing, no pattern detection |
| Sanctions screening (OFAC, UN, EU) | None | No list integration, no real-time checking |
| Travel Rule (originator/beneficiary info) | None | No VASP communication, no data sharing |
| Suspicious Activity Reports (SAR) | None | No FinCEN filing, no automated detection |
| Record keeping (5-7 years) | MongoDB only | No immutable audit, no regulatory format |
| Licensing (Money Transmitter, EMI, etc.) | None | Not registered anywhere |
| Capital requirements | None | Not a financial institution |
| Consumer protection (disclosures, error resolution) | Partial | Only testnet disclaimers |
| Audit (SOC2, financial statement) | None | Prototype only |

## Future Integration Points (Not Implemented)

### For Real Compliance (V2+), These Would Be Needed:

#### KYC/AML Providers
- **Providers**: Jumio, Onfido, Veriff, Persona, Trulioo
- **Integration**: Document verification + liveness + database checks
- **Cost**: ~$1-5 per verification

#### Sanctions Screening
- **Providers**: ComplyAdvantage, Refinitiv, Dow Jones, LexisNexis
- **Integration**: Real-time API screening on every transaction
- **Lists**: OFAC SDN, UN, EU, UK, local jurisdictions

#### Travel Rule (VASP-to-VASP)
- **Standards**: TRISA, OpenVASP, IVMS101
- **Providers**: Notabene, TRM Labs, Chainalysis Travel Rule
- **Requirement**: Originator/beneficiary info for >$3,000 (FinCEN) or €1,000 (EU)

#### Transaction Monitoring
- **Providers**: Chainalysis, Elliptic, TRM Labs, CipherTrace
- **Features**: Risk scoring, pattern detection, SAR automation

#### Regulatory Reporting
- **FinCEN**: CTR (>$10k), SAR (suspicious), FBAR
- **State**: Money transmitter reports
- **International**: FATF, local FIU reporting

## Legal & Regulatory Analysis Required Before Real-Money Launch

### United States
- [ ] **FinCEN Registration** as Money Services Business (MSB)
- [ ] **State Money Transmitter Licenses** (50 states + DC)
- [ ] **NMLS Registration** and bonding
- [ ] **FinCEN BSA/AML Program** (written, approved, tested)
- [ ] **OFAC Compliance Program** (screening, blocking, reporting)
- [ ] **State Consumer Protection** (disclosures, error resolution, privacy)
- [ ] **NY BitLicense** (if serving NY residents)
- [ ] **State-specific requirements** (CA, TX, FL, etc.)

### European Union (MiCA)
- [ ] **CASPs Registration** (Crypto-Asset Service Provider)
- [ ] **Whitepaper** for USDC (if considered asset-referenced token)
- [ ] **Prudential Requirements** (capital, governance, custody)
- [ ] **Consumer Protection** (MiCA Title IV)
- [ ] **Market Abuse** (MAR compliance)
- [ ] **Travel Rule** (EU Regulation 2023/1113)

### International
- [ ] **FATF Recommendations** (VASP guidance)
- [ ] **Local licensing** per jurisdiction
- [ ] **Data Protection** (GDPR, CCPA, LGPD, etc.)
- [ ] **Tax Reporting** (CRS, FATCA, local requirements)

## Operational Governance Required

| Governance Element | V1 Status | Production Requirement |
|-------------------|-----------|------------------------|
| Board oversight | None | Required |
| Compliance officer | None | Required (BSA/AML Officer) |
| Independent audit | None | Annual (SOC2, financial) |
| Penetration testing | None | Quarterly |
| Incident response plan | None | Required (24/7) |
| Vendor risk management | None | Required |
| Training program | None | Annual for all staff |
| Record retention | MongoDB only | 5-7 years, immutable |

## V1 Disclaimer Language

### In-App (Every Page)
> **DollarFlow Testnet Preview** — Uses Base Sepolia test USDC only. Test assets have no monetary value. Do not use DollarFlow for real financial transactions.

### In Transfer Review
> I understand this is a testnet-only transfer using tokens with no financial value.

### In Policy Assessment
> Illustrative safety rules only. This is not KYC, AML, sanctions screening, legal advice, or a compliance determination.

### In Support/Complaints
> This demo support channel does not provide financial, legal, or account-recovery services.

### In Documentation
> DollarFlow V1 is a testnet-only prototype. It does not provide banking, exchange, remittance, custody, or regulated financial services. No KYC, AML, sanctions, or Travel Rule implementation exists. This is not a compliance product.

## Summary

**DollarFlow V1 = Prototype + Testnet + Non-Custodial + Clear Disclaimers**

**DollarFlow V1 ≠ Compliant Financial Service**

Any path to production with real funds requires:
1. Full legal/regulatory analysis per jurisdiction
2. Licensing and registration
3. Real compliance infrastructure (KYC/AML/Sanctions/Travel Rule)
4. Capital, bonding, insurance
5. Governance, audit, incident response
6. Consumer protection framework
7. Ongoing regulatory monitoring

**Do not use V1 code as a basis for regulated services without complete rebuild and legal review.**