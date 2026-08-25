# DollarFlow V1 — Incident and Complaints

## Incident Severity Model

| Severity | Criteria | Response Time | Example |
|----------|----------|---------------|---------|
| **SEV-1 Critical** | Service completely down, data loss, security breach | < 15 min | RPC outage, DB corruption, private key exposure |
| **SEV-2 Major** | Core feature broken, significant user impact | < 1 hour | Wallet verification failing, intent creation broken |
| **SEV-3 Minor** | Non-core feature degraded, workaround exists | < 4 hours | Support form slow, analytics not updating |
| **SEV-4 Low** | Cosmetic, documentation, minor UX issue | Next release | Typo, alignment, missing tooltip |

## RPC Outage Behavior

### Detection
- Backend chain verification polls `https://sepolia.base.org`
- Public RPC is rate-limited (not for production)
- Timeout: 30s per request, 3 retries

### User Impact
| Scenario | User Sees | Backend Behavior |
|----------|-----------|------------------|
| RPC timeout during verification | "Confirming..." stays longer | Retries up to 3x, then marks FAILED |
| RPC returns 429 (rate limit) | "Confirming..." stays longer | Exponential backoff, then FAILED |
| RPC returns 5xx | "Confirming..." stays longer | Retries, then FAILED |
| RPC returns receipt but no Transfer event | "Mismatch: MISSING_TRANSFER_EVENT" | Logs mismatch, marks EXCEPTION_MISMATCH |

### Mitigation (V1)
- Clear error messages in UI: "Base Sepolia RPC temporarily unavailable"
- Retry button on verification failure
- No automatic retry loops that could hammer RPC

### Production Requirement (V2+)
- Managed RPC provider (Alchemy, Infura, QuickNode) with SLA
- Multiple RPC endpoints with failover
- Circuit breaker pattern
- Alerting on RPC error rate > 5%

## Wrong-Network Behavior

### Detection
- Frontend checks `chainId` via `useChainId()` (Wagmi)
- Expected: 84532 (Base Sepolia)

### User Experience
| User State | UI Shown | Action Required |
|------------|----------|-----------------|
| Connected, wrong chain | Yellow banner + "Switch to Base Sepolia" button | Click button → wallet prompts switch |
| Not connected | "Connect Wallet" + network warning | Connect + switch |
| Connected, correct chain | Normal UI | None |

### Technical
```javascript
const { chainId, switchChain } = useWallet();
const isCorrectChain = chainId === 84532;

if (!isCorrectChain) {
  await switchChain({ chainId: 84532 });
}
```

## Suspicious Transfer Report

### User Reporting Flow
1. User sees "Mismatch" status or unexpected behavior
2. Clicks "Report Issue" → Support page with pre-filled transaction ID
3. Selects "Suspicious Activity Report" type
4. Describes concern (wrong recipient, unexpected amount, phishing)
5. Submits → Creates support case with `type: suspicious_activity_report`

### Admin Review (Demo Mode)
- Cases listed in Support page
- Can link to transaction intent
- Resolution notes added
- No real investigation — demo only

### Production Requirements
- Automated alerting on `EXCEPTION_MISMATCH` status
- Integration with blockchain analytics (Chainalysis, TRM)
- SAR filing workflow for >$10k or suspicious patterns
- Law enforcement liaison process

## Support Case Lifecycle

```
OPEN
  │
  ├── User creates case (Support page)
  │   ├── Auto-links to transaction if provided
  │   └── Gets case ID (e.g., case_abc123)
  │
  ▼
IN_REVIEW
  │
  ├── Demo: Auto-moves after 1 min (simulated)
  │   └── No real review in V1
  │
  ▼
RESOLVED
  │
  ├── Resolution note added
  │   └── "Testnet mismatch — verified on-chain data matches"
  │
  ▼
CLOSED
  │
  └── User can view but not modify
```

### Case Fields
| Field | Description |
|-------|-------------|
| `id` | `case_abc123def` |
| `user_id` | Owner |
| `transaction_intent_id` | Optional link |
| `type` | support \| complaint \| suspicious_activity_report |
| `category` | transfer_pending \| wrong_recipient \| wallet_issue \| bug \| safety \| other |
| `description` | Free text (max 5000 chars) |
| `status` | open \| in_review \| resolved \| closed |
| `priority` | low \| normal \| high |
| `assigned_to` | Demo admin (optional) |
| `resolution_note` | Added on resolve |
| `created_at` | Unix timestamp |
| `resolved_at` | Unix timestamp |

## Demo Escalation Workflow

### V1 Demo Behavior
```
User submits case
    │
    ▼
Auto-moves to IN_REVIEW after 60s (simulated)
    │
    ▼
Auto-moves to RESOLVED after 120s with note:
"Illustrative resolution: Testnet verification completed. 
 Mismatch reason: [WRONG_RECIPIENT|WRONG_AMOUNT|...].
 This is a demo — no real investigation performed."
    │
    ▼
Auto-moves to CLOSED after 180s
```

### User Notifications (Demo)
- Toast notification: "Case created: case_abc123"
- Toast notification: "Case resolved: [resolution note]"
- Case visible in Support page with status badge

### Production Notifications
- Email confirmation on creation
- Email on status changes
- In-app notifications
- Webhook to external ticketing (Zendesk, Linear, Jira)

## User-Facing Communications Principles

### Tone
- **Transparent**: "This is a testnet demo"
- **Honest**: "We cannot reverse blockchain transactions"
- **Helpful**: "Here's how to get test ETH: [link]"
- **Non-technical**: Avoid jargon, explain in plain language

### Templates

**Case Created:**
> "Your support case has been created: `case_abc123`. 
> A demo reviewer will look at this shortly. 
> For urgent issues, check the FAQ or try recreating the transaction."

**Case Resolved:**
> "Your case `case_abc123` has been resolved.
> Resolution: [resolution_note]
> If this doesn't address your concern, you can reopen the case."

**Mismatch Detected:**
> "We detected a mismatch between your intended transfer and the on-chain transaction.
> **Mismatch reason**: [WRONG_RECIPIENT / WRONG_AMOUNT / ...]
> This could mean the transaction went to a different address or amount than intended.
> Please review the details and contact support if this was unexpected."

**RPC Outage:**
> "We're temporarily unable to verify transactions due to Base Sepolia RPC issues.
> Your transaction may still be pending. Please check back in a few minutes.
> You can also view the transaction directly on BaseScan: [link]"

## What V1 Does NOT Do

| Real Incident Response | V1 Demo |
|------------------------|---------|
| 24/7 on-call rotation | None |
| Automated alerting (PagerDuty) | None |
| Runbook execution | None |
| Postmortem process | None |
| Customer communication plan | Toast notifications only |
| Regulatory notification (FinCEN, etc.) | None |
| Law enforcement liaison | None |
| SAR filing | None |
| Business continuity plan | None |
| Disaster recovery testing | None |

## Summary for Demo

- **Incidents**: Simulated via RPC timeouts, mismatch statuses
- **Complaints**: Support page with auto-resolving demo cases
- **Escalation**: None — all cases auto-close with demo notes
- **Communications**: Toast notifications only
- **SLA**: None — this is a prototype

**Production would require**: Full incident management, 24/7 ops, regulatory reporting, customer comms plan, postmortem culture.