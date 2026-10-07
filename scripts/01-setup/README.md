# Step 1 — Setup

Connect to Testnet and fund disposable wallets via faucet.
Install `xrpl` at the **repo root** (see root README). Run scripts from the **repo root**.

WebSocket URL: see [`CONCEPTS.md` — Testnet connection](../../CONCEPTS.md#testnet-connection).

## Plan (micro-steps)

1. **Connect skeleton** — Testnet `Client`, `connect` / `disconnect`
2. **Fund one wallet** — `client.fundWallet()`, log address / seed / balance
3. **Fund a second wallet** — same call again; keep both results under different local names (destructuring rename)
4. **Save to `.env`** — store `WALLET_01` / `SEED_01` and `WALLET_02` / `SEED_02` (Testnet only; see root README)
5. **Verify in explorer** — open the account on Testnet (see below)

Script in this folder: `fund-wallets.js`.

## Testnet explorer

[XRPL Testnet Explorer](https://testnet.xrpl.org/) — account page:

`https://testnet.xrpl.org/accounts/<classic-address>`

Replace `<classic-address>` with your funded `r…` address to confirm the account exists and see its balance.
