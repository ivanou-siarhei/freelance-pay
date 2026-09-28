# PayFlow

Freelance escrow on the **Arc** blockchain. Clients lock USDC, freelancers deliver, the smart contract pays out. Freelancers can withdraw earnings cross-chain via Circle App Kit (CCTP).

## Flow
1. Connect wallet → pick a role: **Client** or **Freelancer**.
2. Client creates an escrow (approve + `createEscrow`).
3. Freelancer submits work before the deadline (`submitWork`).
4. Client releases, or after a 3-day review window the freelancer claims.
5. No delivery by deadline → client refunds. Disagreement → dispute (arbiter split, 30-day timeout → 50/50).

## Tech Stack
React 19, Vite, TypeScript, viem, Circle App Kit, Express, PostgreSQL (Neon), Solidity/Hardhat.

## Run locally
```bash
# 1. Contract
cd contracts && npm install && cp .env.example .env   # fill PRIVATE_KEY (new key!) and ARBITRATOR_ADDRESS
npx hardhat test
npm run deploy:arc                                     # copy the printed address

# 2. App
cd .. && npm install && cp .env.example .env           # DATABASE_URL, SESSION_SECRET, VITE_ESCROW_ADDRESS
npm run server    # API on :3001
npm run dev       # UI on :3000 (proxies /api)
```

Arc Testnet: chain ID `5042002`, RPC `https://rpc.testnet.arc.io`, explorer https://testnet.arcscan.app, test USDC from faucet.circle.com.

## Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Frontend dev server |
| `npm run server` | Backend (watch mode) |
| `npm test` | Backend unit tests (vitest) |
| `npm run build` | Production build |
| `npm run lint` | Type-check |

See `SECURITY.md` before deploying.
