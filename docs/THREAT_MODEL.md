# DollarFlow V1 — Threat Model

## Methodology

Based on STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) applied to the DollarFlow V1 architecture.

## Asset Inventory

| Asset | Classification | Value |
|-------|----------------|-------|
| User private keys | High (never in our systems) | N/A — user controlled |
| Session tokens / cookies | High | Account takeover |
| Transaction intent data | Medium | PII + financial intent |
| Audit event log | High | Tamper evidence |
| Wallet addresses (linked) | Medium | PII |
| Support case data | Medium | PII + complaints |
| Backend API keys / secrets | Critical | Full system compromise |

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ User Browser │  │ Attacker     │  │ Base Sepolia RPC   │   │
│  │ (React App)  │  │ (MITM, Phish)│  │ (Public, Untrusted)│   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘   │
└─────────┼─────────────────┼───────────────────┼────────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TLS / HTTPS                                 │
├─────────────────────────────────────────────────────────────────┤
│                    DOLLARFLOW BACKEND                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ FastAPI     │  │ MongoDB     │  │ Private Keys            │ │
│  │ (API)       │  │ (Data)      │  │ (NEVER HERE)            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Threat Analysis (STRIDE)

### 1. Spoofing (Identity)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| T1 | Attacker impersonates user via stolen session cookie | Medium | High | HttpOnly, Secure, SameSite=Strict cookies; short TTL; IP binding |
| T2 | Attacker spoofs wallet address in API calls | Low | High | Authorization: every endpoint checks user_id ownership |
| T3 | Phishing: fake DollarFlow site steals credentials | High | Critical | Never ask for seed phrase; clear warnings; domain verification |
| T4 | Attacker registers wallet to another user's account | Medium | High | Nonce bound to user_id + domain + chain_id; single-use |

### 2. Tampering (Integrity)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| T5 | Attacker modifies transaction intent in transit | Low | High | TLS 1.2+; intent created server-side; client only submits hash |
| T6 | Attacker submits wrong transaction hash | Medium | High | Backend independently verifies receipt + Transfer event |
| T7 | Attacker modifies audit log | Low | Critical | Append-only collection; hash chain verification endpoint |
| T8 | Attacker modifies MongoDB directly | Low | Critical | Network isolation; no direct DB access; least privilege |
| T9 | Frontend modified to hide warnings | Medium | High | CSP headers; Subresource Integrity; build verification |

### 3. Repudiation (Non-Repudiation)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| T10 | User denies creating intent | Low | Medium | SIWE-signed nonce proves wallet ownership at intent creation |
| T11 | User denies submitting tx hash | Low | Medium | API logs + audit trail show user_id + timestamp |
| T12 | Backend admin denies verification result | Low | Medium | Audit hash chain + independent verification service |

### 4. Information Disclosure (Confidentiality)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| T13 | Private keys leaked from backend | N/A | Critical | Private keys NEVER in backend — architectural guarantee |
| T14 | Session token leaked in logs | Medium | High | No sensitive data in structured logs; redaction |
| T15 | Wallet addresses exposed | Medium | Medium | User-scoped queries; no public endpoints |
| T16 | Transaction details in Referer header | Low | Low | rel="noopener noreferrer" on external links |
| T17 | Audit log contains PII | Medium | Medium | Hash IP/user-agent with salt before storage |
| T18 | Support case attachments contain PII | Low | Medium | No file uploads in V1; text only |

### 5. Denial of Service (Availability)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| T19 | RPC rate limit / outage | High | High | Graceful degradation: "Confirming..." longer, clear error |
| T20 | API flood (intent creation) | Medium | Medium | Rate limiting: 20/min per IP; per-user limits in V2 |
| T21 | Wallet verification spam | Medium | Medium | Rate limiting: 10/min; nonce attempt_count max 3 |
| T22 | Large payload DoS | Low | Low | Body size limits (FastAPI default); Pydantic validation |
| T23 | MongoDB connection exhaustion | Low | High | Connection pooling (20 max); timeouts; circuit breaker |

### 6. Elevation of Privilege (Authorization)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|------------|
| T24 | User accesses another's intent | Low | High | Authorization: user_id checked on every query |
| T25 | User accesses another's wallet link | Low | Medium | wallet_links query includes user_id |
| T26 | User accesses another's support case | Low | Medium | support_cases query includes user_id |
| T27 | Admin impersonation | Low | Critical | No admin endpoints in V1; JWT with role claims in V2 |

## Attack Trees

### A1: Steal User Funds (Impossible in V1)
```
Steal Funds
  Compromise Private Key
    Phish Seed Phrase (T3)
    Malware on User Device (out of scope)
    Extract from Backend (T13 - IMPOSSIBLE)
  Trick User into Signing Malicious Tx
    Phishing Site (T3)
    Modify Intent Before Signing (T5)
    Submit Different Hash (T6)
  Intercept Funds in Transit
    MITM on RPC (TLS prevents)
```
**Result**: V1 uses testnet tokens with no value. Real funds impossible to steal.

### A2: Fake Successful Transfer
```
Fake Success
  Backend Marks CONFIRMED Without Verification
    Prevented: Independent verification required
  Frontend Shows Success Without Backend
    Prevented: UI polls backend verification status
  Attacker Submits Valid Hash for Different Tx
    Prevented: Verification matches sender/recipient/amount/contract/chain
  Replay Old Successful Hash
    Prevented: Intent ID check; hash already used = error
```

### A3: Hide Malicious Activity
```
Hide Activity
  Delete Audit Logs
    Prevented: Append-only collection; no DELETE endpoint
  Modify Audit Logs
    Prevented: Hash chain verification
  Modify Intent After Creation
    Prevented: Immutable fields; update only allowed fields
  Impersonate Another User
    Prevented: Session validation + user_id scoping
```

## Risk Matrix

| Threat | Likelihood | Impact | Risk | V1 Mitigation | V2+ Needed |
|--------|------------|--------|------|---------------|------------|
| T3 Phishing | High | Critical | Critical | Warnings, never ask seed | Hardware wallet, passkeys |
| T19 RPC Outage | High | High | Critical | Graceful degradation | Managed RPC, failover |
| T14 Log Leak | Medium | High | High | Structured logging, redaction | Log aggregation, PII scan |
| T20 API Flood | Medium | Medium | High | Rate limits | Per-user limits, WAF |
| T1 Session Hijack | Medium | High | High | Secure cookies, short TTL | CSRF, device binding |
| T21 Wallet Spam | Medium | Medium | High | Rate limits | Per-user limits, captcha |
| T5 Intent Tampering | Low | High | High | Server-side intent, TLS | Request signing (EIP-712) |
| T6 Wrong Hash | Medium | High | High | Independent verification | — |
| T24 Cross-User Access | Low | High | Medium | User-scoped queries | — |
| T7 Audit Tampering | Low | Critical | Medium | Hash chain, append-only | Immutable storage |
| T27 Privilege Escalation | Low | Critical | Medium | No admin roles in V1 | RBAC, MFA |

## Residual Risk Acceptance (V1)

| Risk | Accepted Because | Monitoring |
|----------|------------------|------------|
| Public RPC reliability | V1 is prototype; testnet only | Verification timeout alerts |
| No CSRF protection | Cookie auth low risk; prototype | N/A |
| No per-user rate limits | Prototype scale | Global rate limits |
| Audit salt in env | Prototype; no real value | N/A |
| No encryption at rest | Prototype data | N/A |
| No hardware wallet enforcement | Prototype users | N/A |

## V2+ Security Roadmap

1. **Immediate**: CSRF, per-user rate limits, request signing (EIP-712)
2. **Short-term**: Managed RPC, hardware wallet support, passkeys, CSRF, PII redaction audit
3. **Medium-term**: RBAC, MFA, immutable audit storage, penetration testing, SOC2
4. **Long-term**: Formal verification, bug bounty, threat intelligence, zero-trust architecture

## Testing Threats

| Test | Method | Frequency |
|------|--------|-----------|
| Rate limit enforcement | Automated load test | CI |
| Authorization checks | Integration tests | CI |
| Audit hash chain | Unit + integration | CI |
| RPC failure handling | Chaos engineering | Weekly |
| XSS/CSRF | SAST/DAST | Per release |
| Dependency scanning | Snyk/Dependabot | Per PR |
| Secret scanning | GitLeaks/TruffleHog | Per PR |

## Summary

**V1 Risk Posture**: Prototype with testnet tokens — no real financial value at risk. Architectural decisions (non-custodial, independent verification, audit chain) provide strong foundation. Remaining gaps acceptable for prototype; all have clear V2+ remediation path.

**Critical Principle**: Even if all V1 mitigations fail, **user private keys remain in user's wallet** — the architectural guarantee that funds cannot be stolen from DollarFlow backend.