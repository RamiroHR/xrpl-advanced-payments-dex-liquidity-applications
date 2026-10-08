# Swap on an AMM (UI, no code)

Part of **step 04 — AMM**. Academy assignment **Swap on the AMM** in [Token Issuance & AMM Liquidity](https://academy.xrpl-commons.org/journeys/xrpl-online-dev-training-june-2026/modules/token-issuance-liquidity).

**Prerequisite:** Pool exists (`create-amm.js` / `AMMCreate`).

## What [amm.xrpl.at](https://amm.xrpl.at/) is (and isn’t)

Training UI that **automates much of the same flow as the scripts** (issue / trust / pool / trade-style steps on Testnet).

It does **not**:

- Connect a personal wallet (e.g. Xaman) to browse or trade against arbitrary existing pools
- Act as a pool explorer / directory of Testnet AMMs

For an existing pool you already created: use `amm_info`, [`my-pool.md`](./my-pool.md), and [testnet.xrpl.org](https://testnet.xrpl.org/) (AMM account / issuer). Coded swap comes later (`swap-amm.js`).

## Plan (training UI)

1. Open [amm.xrpl.at](https://amm.xrpl.at/)
2. Follow the UI flow (same ideas as steps 03–04: trust lines, liquidity, swap)
3. Try a small then larger swap size — watch quote / slippage
4. Optional: confirm related accounts/txs on [Testnet explorer](https://testnet.xrpl.org/)

## Finding *your* pool on Testnet

| Goal | Where |
|------|--------|
| Confirm pool state | `amm_info` with the same `asset` / `asset2` as in `create-amm.js` → reserves, fee, **AMM account** |
| Inspect on explorer | Open the **AMM account** (and issuer) on [testnet.xrpl.org](https://testnet.xrpl.org/) |
| Saved addresses | [`my-pool.md`](./my-pool.md) |

Pools are identified by the **asset pair** (currency + issuer ↔ XRP), not a display name.

## Safety

- Testnet only for this learning path

## After this

See root README **Learning path index → 04 — AMM** for `add-liquidity.js` / `swap-amm.js`.
