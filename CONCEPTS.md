# XRPL concepts (learning notes)

Quick skim of ideas already touched in this repo. Setup / how to run: [README](./README.md).

1. [Testnet, wallet, faucet](#testnet-wallet-faucet)
2. [XRP transactions](#xrp-transactions)
3. [IOUs (issued tokens)](#ious-issued-tokens)
4. [Cross-currency payments](#cross-currency-payments)
5. [AMMs](#amms)
6. [DEX (order book) — skim](#dex-order-book--skim)

&nbsp;

---

## Testnet, wallet, faucet

### Testnet connection

```text
wss://s.altnet.rippletest.net:51233          ← primary (this repo)
wss://testnet.xrpl-labs.com/                ← common backup if primary is down
```

`new Client("wss://s.altnet.rippletest.net:51233")` · Explorer: [testnet.xrpl.org](https://testnet.xrpl.org/) · accounts: `https://testnet.xrpl.org/accounts/<address>` · txs: `https://testnet.xrpl.org/transactions/<hash>`

Scripts here use the primary only. Academy-style helpers often try primary then backup so a single public server outage doesn’t block the exercise.

&nbsp;

### Keys and address

**seed → private key → public key → address**

| Piece | Role |
|--------|------|
| **Seed** (`s…`) | Master secret → keypair. `wallet.seed` |
| **Private key** | Signs txs (derived from seed) |
| **Public key** | Verifies signatures ≠ address |
| **Address** (`r…`) | Account id. `wallet.address` |

&nbsp;

### Fund a Testnet wallet — `fundWallet` / faucet API

```js
const { wallet, balance } = await client.fundWallet();
```

Faucet creates a **real** Testnet account with free XRP. Disposable; Testnet can reset. Used in `scripts/01-setup/`.  
Web faucet: [XRP Faucets](https://xrpl.org/resources/dev-tools/xrp-faucets) (Testnet / Devnet).

**Alt — fund via HTTP API** (same faucet, no `fundWallet` sugar; useful if that helper fails, e.g. some browser setups):

```js
const res = await fetch("https://faucet.altnet.rippletest.net/accounts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
const data = await res.json();
const wallet = Wallet.fromSeed(data.seed);
// often poll account_info until the account appears on a validated ledger
```

**Alt — generate locally, activate with XRP** (no faucet for that account): `Wallet.generate()` creates keys offline; the account only exists on-ledger after it receives enough XRP (reserve). A funded wallet sends a small `Payment` to the new address.

```js
const recipient = Wallet.generate(); // local only until funded
await client.submitAndWait({
  TransactionType: "Payment",
  Account: funder.address,
  Destination: recipient.address,
  Amount: xrpToDrops("25"),  // enough for reserve + fees
}, { wallet: funder });
```

&nbsp;

### Validated ledger — `ledger` request

The ledger advances in versions (each has a **ledger index**). **`validated`** means the network has agreed that version is final — safe to treat balances/txs there as settled (not a speculative open/current ledger).

```js
const ledger = await client.request({
  command: "ledger",
  ledger_index: "validated",
});
// ledger.result.ledger_index  → latest finalized ledger number
// ledger.result.validated === true
```

Docs: [ledger](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger) · [Ledger versions](https://xrpl.org/docs/concepts/ledgers/ledger-versions).  
Handy “is the connection alive?” check; many other requests also accept `ledger_index: "validated"`.

&nbsp;

---

## XRP transactions

### Drops vs XRP

- **1 XRP = 1_000_000 drops**
- Ledger / `Payment` **Amount** for XRP is in **drops** (string)
- Humans think in XRP → convert with:

```js
import { xrpToDrops } from "xrpl";
Amount: xrpToDrops("1")   // or xrpToDrops(1)
```

Bare `Amount: 1` means **1 drop**, not 1 XRP.

&nbsp;

### Read XRP balance — `getXrpBalance`

```js
const balance = await client.getXrpBalance(address); // XRP, not drops
```

Pass an **address** string. Used before/after payments in `scripts/02-payment/`.

&nbsp;

### Fees and spendable balance

Every successful tx costs a small **fee in XRP** (paid by the signing account).

- Sender balance change ≈ **−amount − fee**
- Receiver of an XRP payment gets the **amount** only
- Accounts also keep a **reserve**; you cannot spend down to zero

&nbsp;

### XRP Payment

Native XRP transfer — transaction type `"Payment"`:

```js
const payment = {
  TransactionType: "Payment",
  Account: sender.address,
  Destination: receiver.address,
  Amount: xrpToDrops("1"),  // drops string
};
```

Docs: [Payment](https://xrpl.org/docs/references/protocol/transactions/types/payment).  
Later (IOUs): `Amount` becomes `{ currency, issuer, value }` instead of drops.

&nbsp;

### Submit a transaction — `submitAndWait`

Same helper for **any** tx type (`Payment`, `AccountSet`, `TrustSet`, …):

```js
const res = await client.submitAndWait(tx, { wallet: signingWallet });
// res.result.meta.TransactionResult  → e.g. "tesSUCCESS"
// res.result.hash
```

Autofills sequence/fee/etc., signs with `wallet`, then **waits until the tx is in a validated ledger** (or fails / times out). So `tesSUCCESS` here is already final — you don’t need a separate “is it validated?” check. (`submit` alone can return a preliminary result; that is not the same.) Always still read the result code (below).

&nbsp;

### Readable flags (`xrpl` enums)

Prefer named flags from the library over raw hex/`SetFlag` numbers:

```js
import {
  AccountSetAsfFlags,
  TrustSetFlags,
  PaymentFlags,
  // AMMDepositFlags, …
} from "xrpl";

SetFlag: AccountSetAsfFlags.asfDefaultRipple,     // instead of 8
Flags: TrustSetFlags.tfClearNoRipple,             // trust line
Flags: PaymentFlags.tfPartialPayment,             // cross-currency / partial
```

Same on-ledger bits as the docs’ numeric values — easier to read and harder to mistype.

&nbsp;

### Transaction result codes

Check `result.meta.TransactionResult`. These are **result codes**, not account flags.

| Prefix | Meaning |
|--------|---------|
| **`tes…`** | Success |
| **`tec…`** | Failed, fee often claimed |
| **`tef…`** | Failed early |
| **`tem…`** | Malformed |
| **`ter…`** | Retry / temporary |

Full list: [Transaction Results](https://xrpl.org/docs/references/protocol/transactions/transaction-results).

Common: `tesSUCCESS`, `tecUNFUNDED_PAYMENT`, `tecNO_DST` / `tecNO_DST_INSUF_XRP`, `tecPATH_DRY`, `tecNO_LINE`, `tefPAST_SEQ`, `temMALFORMED`.

&nbsp;

---

## IOUs (issued tokens)

### XRP vs IOUs vs MPTs (quick map)

| | **XRP** | **IOU (trust-line token)** | **MPT** |
|--|---------|----------------------------|---------|
| What | Native ledger asset | Issued currency on a **trust line** | Multi-Purpose Token (newer fungible standard) |
| Hold | Account balance | Trust line to an **issuer** | MPT balances (own object model) |
| Send | `Payment` with drops | `Payment` with `{ currency, issuer, value }` (+ trust line) | Own issuance / transfer flows |
| In this path | Steps 01–02 | Step 03+ | Not covered yet |

Docs: [Trust line tokens](https://xrpl.org/docs/concepts/tokens/fungible-tokens/trust-line-tokens) · [MPTs](https://xrpl.org/docs/concepts/tokens/fungible-tokens/multi-purpose-tokens)

&nbsp;

### Issue-token flow (checklist)

1. Issuer: Default Ripple (`AccountSet`)  
2. Holder: `TrustSet`  
3. Issuer: IOU `Payment`  
4. Verify: `account_lines`  

Script: `scripts/03-issue-token/issue-token.js`.

&nbsp;

### Rippling and Default Ripple

**Rippling:** IOUs live on **trust lines**. Rippling is how balances can move **through** accounts (often the issuer) on a payment path (e.g. A → issuer → B).

[Rippling](https://xrpl.org/docs/concepts/tokens/fungible-tokens/rippling) · [Trust line tokens](https://xrpl.org/docs/concepts/tokens/fungible-tokens/trust-line-tokens)

**Why the issuer?** New accounts have Default Ripple **off**, so new trust lines tend to block rippling. Issuers usually turn **Default Ripple on** so lines to them can ripple — needed for normal IOU issue/pay flows in workshops. Set once per issuer.

**`AccountSet` scaffold** ([AccountSet](https://xrpl.org/docs/references/protocol/transactions/types/accountset) · [flags](https://xrpl.org/docs/concepts/accounts/accountset-flags)):

```js
const accountSet = {
  TransactionType: "AccountSet",
  Account: issuer.address,
  SetFlag: AccountSetAsfFlags.asfDefaultRipple,  // or numeric 8
};

await client.submitAndWait(accountSet, { wallet: issuer });
```

Used in `scripts/03-issue-token/`.

&nbsp;

### Trust line — `TrustSet`

Holder allows an issuer’s currency up to a **limit** (token units, not drops). Needed before the issuer can pay them that IOU.

```js
const trustSet = {
  TransactionType: "TrustSet",
  Account: holder.address,
  LimitAmount: {
    currency: "RHR",           // 3-char code (not XRP); or hex for longer codes
    issuer: issuer.address,
    value: "1000000",          // max willing to hold (string)
  },
  // Flags: TrustSetFlags.tfClearNoRipple,  // optional — clear default NoRipple on the line
};

await client.submitAndWait(trustSet, { wallet: holder });
```

Docs: [TrustSet](https://xrpl.org/docs/references/protocol/transactions/types/trustset).  
`LimitAmount.value` = ceiling, not the amount issued.

&nbsp;

### Issue an IOU — `Payment` with object `Amount`

Issuing = issuer **pays** the IOU to the holder (same tx type as XRP, different `Amount`).

```js
const issuePayment = {
  TransactionType: "Payment",
  Account: issuer.address,
  Destination: holder.address,
  Amount: {
    currency: "RHR",           // same as trust line
    issuer: issuer.address,
    value: "20",               // token units, not drops — no xrpToDrops
  },
};

await client.submitAndWait(issuePayment, { wallet: issuer });
```

| | XRP `Amount` | IOU `Amount` |
|--|--------------|--------------|
| Shape | drops string | `{ currency, issuer, value }` |
| Helper | `xrpToDrops(...)` | plain decimal string |

&nbsp;

### Read IOU balance — `account_lines`

`getXrpBalance` = **XRP only**. Issued tokens → trust lines:

```js
const res = await client.request({
  command: "account_lines",
  account: holder.address,
  peer: issuer.address,        // optional filter
});

// res.result.lines[i].balance | .currency | .account
```

Docs: [account_lines](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/account-methods/account_lines).  
Explorer: holder account → trust lines / balances.

&nbsp;

---

## AMMs

Docs overview: [Automated Market Makers](https://xrpl.org/docs/concepts/tokens/decentralized-exchange/automated-market-makers).  
Scripts: `scripts/04-amm/` (`create-amm.js`, `add-liquidity.js`, …).

&nbsp;

### Constant product — spot vs what you receive

Pool holds two assets. Swaps keep (approximately) **x × y = k** (fee omitted in the sketch below).

#### Spot price ≠ execution (worked example)

Pool: **20 XRP** and **1000** token (e.g. xRRH).

**Spot** (UI “current price”) = reserve ratio = slope of the curve *right now*:

```text
1000 / 20 = 50 token per XRP
```

That’s the rate for an **infinitesimal** trade — not a promise for a large fill.

Swap **1 XRP** in (fee ignored). Keep **x × y = k** with k = 20 × 1000 = **20000**:

```text
XRP after:     21
Token after:   20000 / 21 ≈ 952.38
You receive:   1000 - 952.38 ≈ 47.62 token
```

Average rate ≈ **47.6 per XRP**, not 50. The gap is mostly **slippage** (you moved along the curve). A **0.5% fee** only explains a small extra haircut — not the whole 50 → 47.6 gap.  
Here 1 XRP is **5% of the XRP side** → large impact. Deeper pool ⇒ closer to spot.

#### Insights (quick skim)

- Pool state **moves on the curve** when someone swaps; reserves change, spot changes.
- **Spot / instantaneous price ≈ slope** of the curve at the current point (ratio of reserves), not **k**.
- **k** is the product invariant (rough size of the pool’s “scale”), **not** the price.
- As a **taker**, average fill vs pre-trade spot is **worse** — later units of your swap are filled at a worse instantaneous price (you push the curve against yourself). Fees make it slightly worse still.
- **Splitting** one large trade into chunks on the **same** pool does **not** improve slippage (same total size ⇒ same end reserves, ignoring others). With fees, splits can be **worse** (fee paid more often).
- **Trading fee** (e.g. `TradingFee: 500` → 0.5%) is on top of curve impact; don’t confuse fee with slippage.
- Only **one AMM per asset pair**; more liquidity later → `AMMDeposit`, not a second `AMMCreate`.

&nbsp;

### Create pool — `AMMCreate`

Create the **one** AMM for an asset pair and seed both sides. Returns LP tokens to the creator. Used in `scripts/04-amm/create-amm.js`.

```js
const txCreate = {
  TransactionType: "AMMCreate",
  Account: creator.address,
  Amount: { currency: "RHR", issuer: issuer.address, value: "200" },
  Amount2: xrpToDrops("10"),
  TradingFee: 500,  // 0.5%
};

await client.submitAndWait(txCreate, { wallet: creator });
```

Docs: [AMMCreate](https://xrpl.org/docs/references/protocol/transactions/types/ammcreate).  
Do not re-run for the same pair — deposit more with `AMMDeposit` instead.

&nbsp;

### Read pool — `amm_info`

Request (not a transaction). Look up reserves, fee, AMM account, LP token, etc.

```js
const res = await client.request({
  command: "amm_info",
  asset: { currency: "RHR", issuer: issuer.address },
  asset2: { currency: "XRP" },
});

// res.result.amm  → amount, amount2, account, trading_fee, lp_token, …
```

Docs: [amm_info](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/amm_info).  
Saved addresses: `scripts/04-amm/my-pool.md`.

&nbsp;

### Add liquidity — `AMMDeposit`

Deposit into an existing pool → receive **LP tokens**. `Asset` / `Asset2` identify the pool; `Amount` / `Amount2` are what you offer; **Flags** pick the mode.

```js
const txDeposit = {
  TransactionType: "AMMDeposit",
  Account: depositor.address,
  Asset: { currency: "RHR", issuer: issuer.address },
  Asset2: { currency: "XRP" },
  Amount: { currency: "RHR", issuer: issuer.address, value: "300" },
  Amount2: xrpToDrops("15"),
  Flags: 0x00100000,  // tfTwoAsset — deepen at current ratio
};

await client.submitAndWait(txDeposit, { wallet: depositor });
```

Docs: [AMMDeposit](https://xrpl.org/docs/references/protocol/transactions/types/ammdeposit) (flag list there).  
`tfTwoAsset`: `Amount`/`Amount2` are **caps** — ledger takes a proportional slice (under-deposit if unbalanced); spot ~unchanged. Single-asset flags add one side and **reprice**. Used in `scripts/04-amm/add-liquidity.js`.

&nbsp;

### Swap via AMM — `Payment` (self)

No special “Swap” tx. Convert through the pool with a **`Payment`** to yourself: `Amount` = what you want **out**, `SendMax` = max you will **spend**. Trader needs a **trust line** to receive the IOU. Used in `scripts/04-amm/swap-amm.js`.

```js
// XRP → RHR (done in learning path)
const txSwap = {
  TransactionType: "Payment",
  Account: trader.address,
  Destination: trader.address,  // self = currency conversion
  Amount: { currency: "RHR", issuer: issuer.address, value: "2" },  // want out
  SendMax: xrpToDrops("0.5"),  // max XRP in
};

await client.submitAndWait(txSwap, { wallet: trader });
```

Docs: [Payment](https://xrpl.org/docs/references/protocol/transactions/types/payment) · AMM liquidity used on the path.  
Reverse (RHR → XRP): IOU in `SendMax`, XRP drops string in `Amount` — practice later.

&nbsp;

### Remove liquidity — `AMMWithdraw`

Redeem **LP tokens** → get assets out of the pool. Same `Asset` / `Asset2` pair idea as deposit; **Flags** pick the mode. *(Later practice — no script yet.)*

```js
const txWithdraw = {
  TransactionType: "AMMWithdraw",
  Account: lp.address,
  Asset: { currency: "RHR", issuer: issuer.address },
  Asset2: { currency: "XRP" },
  Amount: { currency: "RHR", issuer: issuer.address, value: "50" },
  Amount2: xrpToDrops("2.5"),
  Flags: 0x00100000,  // tfTwoAsset — both sides, proportional
};

await client.submitAndWait(txWithdraw, { wallet: lp });
```

Docs: [AMMWithdraw](https://xrpl.org/docs/references/protocol/transactions/types/ammwithdraw) (flag list there).  
Two-asset modes keep ratio (~no reprice fee); single-asset withdraw can reprice and charge an effective fee. Emptying the pool may auto-delete the AMM (or leave cleanup for `AMMDelete`).

&nbsp;

### Delete empty AMM — `AMMDelete`

Remove an **empty** AMM that could not be fully deleted in one withdraw (too many trust lines). Anyone can submit; may need **several** `AMMDelete`s (`tecINCOMPLETE`). *(Later practice — no script yet.)*

```js
const txDelete = {
  TransactionType: "AMMDelete",
  Account: anyAccount.address,
  Asset: { currency: "RHR", issuer: issuer.address },
  Asset2: { currency: "XRP" },
};

await client.submitAndWait(txDelete, { wallet: anyAccount });
```

Docs: [AMMDelete](https://xrpl.org/docs/references/protocol/transactions/types/ammdelete).  
Fails with `tecAMM_NOT_EMPTY` if the pool still has assets — withdraw first.

&nbsp;

### Vote trading fee — `AMMVote`

LP holders vote on the pool’s **TradingFee** (weighted by LP tokens; up to 8 votes). Fee units: `1` = 0.001%, max `1000` = 1%. *(Later practice — no script yet.)*

```js
const txVote = {
  TransactionType: "AMMVote",
  Account: lp.address,
  Asset: { currency: "RHR", issuer: issuer.address },
  Asset2: { currency: "XRP" },
  TradingFee: 600,  // 0.6%
};

await client.submitAndWait(txVote, { wallet: lp });
```

Docs: [AMMVote](https://xrpl.org/docs/references/protocol/transactions/types/ammvote).  
You must hold this AMM’s LP tokens to vote.

&nbsp;

---

## Cross-currency payments

Pay **out** in one asset while the sender **spends** another (e.g. deliver TST, pay with XRP) using the DEX / paths. Same `Payment` type; extra fields for safety and routing.  
Docs: [Cross-currency payments](https://xrpl.org/docs/concepts/payment-types/cross-currency-payments) · [Partial payments](https://xrpl.org/docs/concepts/payment-types/partial-payments).

&nbsp;

### Find a path — `ripple_path_find`

Ask the server for routes from what you hold to what the destination should receive:

```js
const paths = await client.request({
  command: "ripple_path_find",
  source_account: sender.address,
  destination_account: recipient.address,
  destination_amount: { currency: "TST", issuer: issuer.address, value: "5" },
  source_currencies: [{ currency: "XRP" }],
});
// paths.result.alternatives[0].paths_computed  → use as Payment.Paths
// paths.result.alternatives[0].source_amount   → quoted cost (estimate)
```

Docs: [ripple_path_find](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/path-and-order-book-methods/ripple_path_find).

&nbsp;

### Protected cross-currency `Payment`

```js
const tx = {
  TransactionType: "Payment",
  Account: sender.address,
  Destination: recipient.address,
  Amount: { currency: "TST", issuer: issuer.address, value: "5" }, // want to deliver
  SendMax: xrpToDrops("3"),                                        // max to spend
  DeliverMin: { currency: "TST", issuer: issuer.address, value: "4.9" },
  Flags: PaymentFlags.tfPartialPayment,                            // needed with DeliverMin
  Paths: alternative.paths_computed,
};

await client.submitAndWait(tx, { wallet: sender });
```

| Field | Role |
|-------|------|
| `Amount` | Target deliver (IOU object or XRP drops) |
| `SendMax` | Cap on what the **sender** spends |
| `DeliverMin` | Floor on what the **destination** must receive (with partial payment) |
| `Paths` | Route from `ripple_path_find` (or omit and let rippling/default paths try) |

After validation, what actually arrived is often in **`meta.delivered_amount`** (XRP = drops **string**; IOU = `{ currency, issuer, value }`). Don’t assume it equals `Amount` when partial payment is on.

&nbsp;

---

## DEX (order book) — skim

Order book (CLOB) liquidity via offers — deeper practice later. Academy “advanced payments” often posts a thin book so `ripple_path_find` has a path.

&nbsp;

### Post liquidity — `OfferCreate`

```js
const offer = {
  TransactionType: "OfferCreate",
  Account: maker.address,
  TakerGets: { currency: "TST", issuer: issuer.address, value: "500" }, // taker receives
  TakerPays: xrpToDrops("250"),                                        // taker pays
};

await client.submitAndWait(offer, { wallet: maker });
```

Docs: [OfferCreate](https://xrpl.org/docs/references/protocol/transactions/types/offercreate) · [Offers](https://xrpl.org/docs/concepts/tokens/decentralized-exchange/offers).  
`TakerGets` / `TakerPays` = what the **taker** gets / pays when they consume the offer.
