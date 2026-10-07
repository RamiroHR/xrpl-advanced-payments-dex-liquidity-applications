# XRPL learning path — Advanced Payments, DEX & Liquidity

Hands-on practice from basic Testnet operations toward DEX and liquidity concepts.
Scripts run locally with Node.js against **XRPL Testnet**.

Shared XRPL notes (Testnet URL, keys, result codes, rippling, …): [`CONCEPTS.md`](./CONCEPTS.md).

## Initial setup (repo root)

Do this once for the whole project:

```bash
# from the repo root
npm init -y
npm install xrpl
```

That creates `package.json` and installs the official XRPL JavaScript library. After cloning, if `node_modules` is missing, run `npm install` (no package name).

Testnet WebSocket URL and explorer: see [`CONCEPTS.md` — Testnet connection](./CONCEPTS.md#testnet-connection).

## Testnet wallets (`.env`)

After funding wallets (e.g. `scripts/01-setup/`), store addresses and seeds locally:

1. Copy the template: `cp .env.example .env` (or edit `.env` if it already exists)
2. Fill in values from your faucet output (**Testnet only**)

| Variable | Meaning | Typical roles |
|----------|---------|----------------|
| `WALLET_01` | Address (`r…`) | sender, issuer, … |
| `SEED_01` | Seed (`s…`) | signs for wallet 01 |
| `WALLET_02` | Address (`r…`) | receiver, holder, … |
| `SEED_02` | Seed (`s…`) | signs for wallet 02 |

`.env` is gitignored. `.env.example` is the committed template (empty placeholders only).

### Check a wallet on Testnet

Open the [XRPL Testnet Explorer](https://testnet.xrpl.org/) and look up an account:

`https://testnet.xrpl.org/accounts/<classic-address>`

Example shape: `https://testnet.xrpl.org/accounts/rXXXXXXXX…` — paste your `WALLET_01` or `WALLET_02` address after `/accounts/`. Details also in [`CONCEPTS.md`](./CONCEPTS.md#testnet-connection).

## Layout

```
.
├── package.json     # Node project (repo root)
├── CONCEPTS.md      # Shared XRPL learning notes (committed)
├── .env             # Local Testnet wallets (gitignored)
├── .env.example     # Template for .env (safe to commit)
└── scripts/         # One folder per learning step
    ├── 01-setup/
    ├── 02-payment/
    ├── 03-issue-token/
    ├── 04-amm-create/   # code: AMMCreate + amm_info
    └── 05-amm-swap-ui/  # no code: swap via amm.xrpl.at
```

Aligned with Academy module [Token Issuance & AMM Liquidity](https://academy.xrpl-commons.org/journeys/xrpl-online-dev-training-june-2026/modules/token-issuance-liquidity).

## Learning path (current)

| Step | Folder | Goal |
|------|--------|------|
| 1 | `scripts/01-setup/` | Connect to Testnet, fund wallets via faucet |
| 2 | `scripts/02-payment/` | Load wallets from `.env`, read balances, send XRP |
| 3 | `scripts/03-issue-token/` | Default Ripple, trust line, issue an IOU |
| 4 | `scripts/04-amm-create/` | Create XRP/token AMM (`AMMCreate`) + `amm_info` |
| 5 | `scripts/05-amm-swap-ui/` | Swap on the pool via [amm.xrpl.at](https://amm.xrpl.at/) (UI) |

Later: coded swaps, order-book offers, more liquidity topics.

## How to run

From the **repo root**:

```bash
node scripts/01-setup/your-script.js
```

## Learning scripts vs production

Scripts under `scripts/` favor a clear happy path so each XRPL concept stays easy to read. They often **omit** `try/catch`, retries, and strict env validation on purpose — not because those don’t matter.

When you reuse this as a base for a real app or long-running service, add at least:

- Error handling around network / ledger calls (`try/catch`, useful logging)
- Checks that a tx actually succeeded (e.g. `TransactionResult` / `tesSUCCESS`), not only that `submitAndWait` returned
- Validation of required `.env` values before signing
- `try/finally` (or equivalent) so the client **disconnects** even when something fails

## Safety

- Testnet only. Never reuse Testnet seeds on Mainnet.
- Put real seeds only in `.env` — never in `.env.example` or committed files.
- Do not commit `.env`, seeds, or funded wallet files.
