# XRPL learning path — Advanced Payments, DEX & Liquidity

Hands-on practice from basic Testnet operations toward DEX and liquidity concepts.
Scripts run locally with Node.js against **XRPL Testnet**.

- Protocol skim: [`CONCEPTS.md`](./CONCEPTS.md)
- Academy alignment: [Token Issuance & AMM Liquidity](https://academy.xrpl-commons.org/journeys/xrpl-online-dev-training-june-2026/modules/token-issuance-liquidity)

## Initial setup (repo root)

Do this once for the whole project:

```bash
# from the repo root
npm init -y
npm install xrpl
```

That creates `package.json` and installs the official XRPL JavaScript library. After cloning, if `node_modules` is missing, run `npm install` (no package name).

Testnet WebSocket URL and explorer: [`CONCEPTS.md` — Testnet, wallet, faucet](./CONCEPTS.md#testnet-wallet-faucet).  
Web faucet (top up / new accounts): [XRP Faucets](https://xrpl.org/resources/dev-tools/xrp-faucets).

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

Check an account: `https://testnet.xrpl.org/accounts/<classic-address>`

## Layout

```
.
├── package.json
├── CONCEPTS.md
├── .env / .env.example
└── scripts/
    ├── 01-setup/
    ├── 02-payment/
    ├── 03-issue-token/
    └── 04-amm/
```

Run any script from the **repo root**, e.g. `node scripts/02-payment/send-xrp.js`.

---

## Learning path

Skim protocol notes in [`CONCEPTS.md`](./CONCEPTS.md). Run scripts from the repo root.

**01 Setup** — `scripts/01-setup/`

- `fund-wallets.js` — fund two Testnet wallets, save seeds to `.env`

**02 Payment** — `scripts/02-payment/`

- `send-xrp.js` — send XRP; print balances before/after

**03 Issue a token** — `scripts/03-issue-token/`

- `issue-token.js` — Default Ripple, trust line, issue IOU, verify
- `send-iou.js` *(later)* — send that IOU between two holders

**04 AMM** — `scripts/04-amm/`  
*(one pool per asset pair; don’t re-run `AMMCreate` for the same pair)*

- `create-amm.js` — create XRP/token pool, then `amm_info`
- [`swap-ui.md`](./scripts/04-amm/swap-ui.md) — training UI ([amm.xrpl.at](https://amm.xrpl.at/)) vs finding your own pool
- [`my-pool.md`](./scripts/04-amm/my-pool.md) — saved Testnet AMM account / issuer links (addresses only)
- `add-liquidity.js` — `AMMDeposit` (two-asset) into existing pool, check via `amm_info` / explorer
- `swap-amm.js` — swap **XRP → token** via self-`Payment` (`Amount` / `SendMax`); see [`CONCEPTS.md`](./CONCEPTS.md)

**04 — later practice** *(skim scaffolds in [`CONCEPTS.md`](./CONCEPTS.md); scripts optional)*

- Swap the **other direction** (token → XRP) in `swap-amm.js` or a small variant
- `AMMWithdraw` — remove liquidity / redeem LP tokens
- `AMMDelete` — delete an empty AMM
- `AMMVote` — vote on the pool trading fee
- `send-iou.js` (step 03) — send the IOU between two holders

**Academy — Advanced payments** *(concepts in [`CONCEPTS.md`](./CONCEPTS.md); no dedicated scripts yet)*

- Activate account: `Wallet.generate()` + XRP `Payment` (vs faucet)
- Readable flags: `TrustSetFlags` / `PaymentFlags` / `AccountSetAsfFlags`
- Cross-currency `Payment`: `ripple_path_find`, `SendMax`, `DeliverMin`, `tfPartialPayment`, `Paths`, `delivered_amount`
- Thin order-book liquidity: `OfferCreate` (see DEX skim)

**Later**

- Order-book DEX (offers / CLOB) — deepen beyond the skim
- More liquidity topics as needed

---

## Learning scripts vs production

Scripts under `scripts/` favor a clear happy path so each XRPL concept stays easy to read. They often **omit** `try/catch`, retries, and strict env validation on purpose — not because those don’t matter.

When you reuse this as a base for a real app or long-running service, add at least:

- Error handling around network / ledger calls (`try/catch`, useful logging)
- Checks that a tx actually succeeded (e.g. `TransactionResult` / `tesSUCCESS`), not only that `submitAndWait` returned
- Validation of required `.env` values before signing
- `try/finally` (or equivalent) so the client **disconnects** even when something fails

## Safety

- Testnet only for this learning path. Never reuse Testnet seeds on Mainnet.
- Put real seeds only in `.env` — never in `.env.example` or committed files.
- Do not commit `.env`, seeds, or funded wallet files.

**Signing:** These scripts use **local signing** with `xrpl.js` (`Wallet` + `submitAndWait`) — the seed stays on your machine; only the signed tx goes to the network. That matches the “client library with local signing” approach in [Secure Signing](https://xrpl.org/docs/concepts/transactions/secure-signing).

**`.env` for secrets:** Fine for **Testnet** throwaway wallets. On **Mainnet**, local signing is still the right idea, but a **plaintext `.env` file is a weak way to store keys** (disk, backups, screenshots, repo accidents). Treat it as convenience for learning, not as a strong production setup — see that same page for better options (e.g. a secrets manager, tighter machine hygiene; hardware devices are optional, not required).
