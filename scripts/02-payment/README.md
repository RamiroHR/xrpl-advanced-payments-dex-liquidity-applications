# Step 2 — Payment

Send XRP from one Testnet account to another, and verify with balance reads.
Use wallets from the repo-root `.env` (`WALLET_01` / `SEED_01`, `WALLET_02` / `SEED_02`).
Run scripts from the **repo root**.

WebSocket URL: see [`CONCEPTS.md` — Testnet connection](../../CONCEPTS.md#testnet-connection).

## Plan (micro-steps)

1. **Connect skeleton** — Testnet `Client`, `connect` / `disconnect`
2. **Load wallets from `.env`** — rebuild `Wallet`s from seeds (e.g. `Wallet.fromSeed`)
3. **Read balances (before)** — query XRP balance for sender and receiver
4. **Submit a Payment** — send XRP from wallet 01 → wallet 02
5. **Read balances (after)** — same query again; confirm the change

Add your script(s) in this folder as you go (e.g. `send-xrp.js`).

## Testnet explorer

[XRPL Testnet Explorer](https://testnet.xrpl.org/) —  
`https://testnet.xrpl.org/accounts/<classic-address>` (also useful after a payment).
