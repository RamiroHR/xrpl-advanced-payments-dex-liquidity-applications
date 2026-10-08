import { Client, Wallet, xrpToDrops } from "xrpl";
import dotenv from "dotenv";

dotenv.config();

const client = new Client("wss://s.altnet.rippletest.net:51233");

async function main() {
    await client.connect();
    console.log("connected to testnet");

    // import token and issuer
    const token = "RHR";
    const issuer = Wallet.fromSeed(process.env.SEED_03);

    // import trader (a holder with a trsutline to the issuer)
    const trader = Wallet.fromSeed(process.env.SEED_01);

    // read trader token balance
    const res_before = await client.request({
        command: "account_lines",
        account: trader.address,
        peer: issuer.address,
    })
    console.log({
        step: "Trader IOU balance before swap",
        balance: res_before.result.lines[0].balance,
        currency: token,
    })

    // swap XRP (in) for RHR token (out)
    const TxSwap = {
        TransactionType: "Payment",
        Account: trader.address,
        Destination: trader.address,
        Amount: {
            currency: token,
            issuer: issuer.address,
            value: "2",
        },
        SendMax: xrpToDrops("0.5"),
    };

    const res_swap = await client.submitAndWait(TxSwap, {wallet: trader});

    console.log({
        step: "swap transaction XRP to Token",
        status: res_swap.result.meta.TransactionResult,
        hash: res_swap.result.hash,
    })


    // read trader token balance after
    const res_after = await client.request({
        command: "account_lines",
        account: trader.address,
        peer: issuer.address,
    })
    console.log({
        step: "Trader IOU balance after swap",
        balance: res_after.result.lines[0].balance,
        currency: token,
    })

    await client.disconnect();
    console.log("disconnect form testnet");
};

main();