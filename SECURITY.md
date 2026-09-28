# Security notes

## ⚠️ Action required
The previous archive contained `contracts/.env` with a real `PRIVATE_KEY`. Treat that key as compromised:
1. Move any funds off that wallet.
2. Generate a new deployer key, never commit it (`.env` is git-ignored, but check archives/zips too).
3. Redeploy FlowPayEscrow v2 with `ARBITRATOR_ADDRESS` set to a multisig (e.g. Safe), not the deployer.

## What was fixed
Contract
- Freelancer can no longer take funds without delivering (`claimAfterDeadline` removed → `submitWork` + 3-day review → `claimAfterReview`).
- Client can refund if work was not submitted by the deadline (`refundAfterDeadline`), freelancer can cancel (`refundByFreelancer`).
- Disputes: partial split by arbiter, 30-day timeout → 50/50 so funds can't get stuck forever.
- Arbiter can't be a party of a deal; ownership transfer is two-step.
- SafeERC20 handles tokens returning no value; fee-on-transfer tokens are rejected; deadline capped at 365 days.

Backend
- All profile/payout routes require a wallet-signature session; data is scoped to the signed-in address (no more IDOR on `PUT /api/profiles/:id`).
- Payout records are verified on-chain (tx sender must be the signed-in wallet), unique by tx hash.
- Input validation, lowercase addresses, 10kb body limit, rate limiting, CORS allowlist, security headers, generic 500 errors.
- Server no longer holds Circle entity secrets or bridges funds; fee to zero address removed.

Frontend
- Real contract calls with simulate-before-send, exact-amount approve (no infinite approvals).
- Shared wallet state (previously every component had its own disconnected wallet).
- Role picker, account/chain change handling, removed the global `Object.defineProperty` patch.
