# PayFlow

Crypto payment platform with escrow support: streams, invoices, and cross-chain USDC payouts.

## Features

- Escrow payments via `FlowPayEscrow` smart contract
- Stream Manager and Invoice & Escrow Vault dashboard
- Circle App Kit integration (in progress)
- Cross-chain USDC payouts (planned)

## Tech Stack

React 19, Vite, TypeScript, Express, PostgreSQL (Neon), Circle / viem, Solidity

## Run Locally

**Prerequisites:** Node.js

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the values (`DATABASE_URL`, `CIRCLE_API_KEY`, etc.)
3. `npm run dev` — app runs at `http://localhost:3000`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |
