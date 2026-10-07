# Step 3 — Issue a token

Create an issued currency (IOU) on Testnet: configure the issuer, open a trust line, then issue tokens with a Payment.
Use wallets from the repo-root `.env` — typically **wallet 01 = issuer**, **wallet 02 = holder**.
Run scripts from the **repo root**.

WebSocket / explorer: see [`CONCEPTS.md` — Testnet connection](../../CONCEPTS.md#testnet-connection).

## Plan (micro-steps)

1. **Connect + load wallets** — reuse the `.env` / `Wallet.fromSeed` pattern from step 02
2. **Default Ripple on the issuer** — `AccountSet` with `asfDefaultRipple` (new concept; see below)
3. **Trust line** — holder submits `TrustSet` (currency + issuer + limit)
4. **Issue tokens** — issuer sends a `Payment` whose `Amount` is an IOU object `{ currency, issuer, value }` (not XRP drops)
5. **Verify** — check holder balance / trust lines in code and/or [Testnet explorer](https://testnet.xrpl.org/)

Suggested script name: `issue-token.js`.

## Concept notes

Rippling, why Default Ripple on the issuer, and `AccountSet`: see [`CONCEPTS.md`](../../CONCEPTS.md#rippling-and-default-ripple-issued-ious).

## Mapping to the June training exercise

After this step you should be able to complete:

- Day 2 Step 1 — Default Ripple (`AccountSet`)
- Day 2 Step 2 — TrustSet + issue IOU Payment  

(Scaffolding there uses `wallets.json` / CommonJS; same ledger txs.)
