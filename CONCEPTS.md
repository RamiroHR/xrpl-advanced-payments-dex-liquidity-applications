# XRPL concepts (learning notes)

Quick skim of ideas already touched in this repo. Setup / how to run: [README](./README.md).

---

## Testnet connection

```text
wss://s.altnet.rippletest.net:51233
```

`new Client("wss://s.altnet.rippletest.net:51233")` · Explorer: [testnet.xrpl.org](https://testnet.xrpl.org/) · accounts: `https://testnet.xrpl.org/accounts/<address>` · txs: `https://testnet.xrpl.org/transactions/<hash>`

---

## Keys and address

**seed → private key → public key → address**

| Piece | Role |
|--------|------|
| **Seed** (`s…`) | Master secret → keypair. `wallet.seed` |
| **Private key** | Signs txs (derived from seed) |
| **Public key** | Verifies signatures ≠ address |
| **Address** (`r…`) | Account id. `wallet.address` |

---

## Fund a Testnet wallet — `fundWallet`

```js
const { wallet, balance } = await client.fundWallet();
```

Faucet creates a **real** Testnet account with free XRP. Disposable; Testnet can reset. Used in `scripts/01-setup/`.

---

## Read XRP balance — `getXrpBalance`

```js
const balance = await client.getXrpBalance(address); // XRP, not drops
```

Pass an **address** string. Used before/after payments in `scripts/02-payment/`.

---

## Drops vs XRP

- **1 XRP = 1_000_000 drops**
- Ledger / `Payment` **Amount** for XRP is in **drops** (string)
- Humans think in XRP → convert with:

```js
import { xrpToDrops } from "xrpl";
Amount: xrpToDrops("1")   // or xrpToDrops(1)
```

Bare `Amount: 1` means **1 drop**, not 1 XRP.

---

## XRP vs IOUs vs MPTs (quick map)

| | **XRP** | **IOU (trust-line token)** | **MPT** |
|--|---------|----------------------------|---------|
| What | Native ledger asset | Issued currency on a **trust line** | Multi-Purpose Token (newer fungible standard) |
| Hold | Account balance | Trust line to an **issuer** | MPT balances (own object model) |
| Send | `Payment` with drops | `Payment` with `{ currency, issuer, value }` (+ trust line) | Own issuance / transfer flows |
| In this path | Steps 01–02 | Step 03+ | Not covered yet |

Docs: [Trust line tokens](https://xrpl.org/docs/concepts/tokens/fungible-tokens/trust-line-tokens) · [MPTs](https://xrpl.org/docs/concepts/tokens/fungible-tokens/multi-purpose-tokens)

---

## Fees and spendable balance

Every successful tx costs a small **fee in XRP** (paid by the signing account).

- Sender balance change ≈ **−amount − fee**
- Receiver of an XRP payment gets the **amount** only
- Accounts also keep a **reserve**; you cannot spend down to zero

---

## XRP Payment

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

---

## Submit a transaction — `submitAndWait`

Same helper for **any** tx type (`Payment`, `AccountSet`, `TrustSet`, …):

```js
const res = await client.submitAndWait(tx, { wallet: signingWallet });
// res.result.meta.TransactionResult  → e.g. "tesSUCCESS"
// res.result.hash
```

Autofills sequence/fee/etc., signs with `wallet`, waits for validation. Always check the result code (below).

---

## Transaction result codes

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

---

## Rippling and Default Ripple (IOUs)

**Rippling:** IOUs live on **trust lines**. Rippling is how balances can move **through** accounts (often the issuer) on a payment path (e.g. A → issuer → B).

[Rippling](https://xrpl.org/docs/concepts/tokens/fungible-tokens/rippling) · [Trust line tokens](https://xrpl.org/docs/concepts/tokens/fungible-tokens/trust-line-tokens)

**Why the issuer?** New accounts have Default Ripple **off**, so new trust lines tend to block rippling. Issuers usually turn **Default Ripple on** so lines to them can ripple — needed for normal IOU issue/pay flows in workshops. Set once per issuer.

**`AccountSet` scaffold** ([AccountSet](https://xrpl.org/docs/references/protocol/transactions/types/accountset) · [flags](https://xrpl.org/docs/concepts/accounts/accountset-flags)):

```js
const accountSet = {
  TransactionType: "AccountSet",
  Account: issuer.address,
  SetFlag: 8,  // asfDefaultRipple (or AccountSetAsfFlags.asfDefaultRipple)
};

await client.submitAndWait(accountSet, { wallet: issuer });
```

Used in `scripts/03-issue-token/`.

---

## Trust line — `TrustSet`

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
};

await client.submitAndWait(trustSet, { wallet: holder });
```

Docs: [TrustSet](https://xrpl.org/docs/references/protocol/transactions/types/trustset).  
`LimitAmount.value` = ceiling, not the amount issued.

---

## Issue an IOU — `Payment` with object `Amount`

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

---

## Read IOU balance — `account_lines`

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

---

## Issue-token flow (checklist)

1. Issuer: Default Ripple (`AccountSet`)  
2. Holder: `TrustSet`  
3. Issuer: IOU `Payment`  
4. Verify: `account_lines`  

Script: `scripts/03-issue-token/issue-token.js`.

---

## (Add more below)

DEX / offers, AMM, … as you touch them.
