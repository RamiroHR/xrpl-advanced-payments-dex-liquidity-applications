import { Client, Wallet } from "xrpl";
import dotenv from "dotenv";

dotenv.config();

const client = new Client("wss://s.altnet.rippletest.net:51233");

async function main() {
    await client.connect();
    console.log("Connected to Testnet");

    // instantiate the wallets
    const holder = Wallet.fromSeed(process.env.SEED_01);
    const issuer = Wallet.fromSeed(process.env.SEED_03);
    console.log({
        holder: holder.address,
        issuer: issuer.address
    });

    // Allow reppling via issuer (Set Account)
    const TxAccountSet = {
        TransactionType: "AccountSet",
        Account: issuer.address,
        SetFlag: 8,
    }

    const res1 = await client.submitAndWait(TxAccountSet, {wallet: issuer});

    console.log({
        tx: TxAccountSet.TransactionType,
        status: res1.result.meta.TransactionResult,
        hash: res1.result.hash
    })

    // Set a trust line from the holder
    const currency = "RHR"

    const TxTrustSet = {
        TransactionType: "TrustSet",
        Account: holder.address,
        LimitAmount: { 
            currency, 
            issuer: issuer.address, 
            value: "1000000",
        },
    };

    const res2 = await client.submitAndWait(TxTrustSet, {wallet: holder});

    console.log({
        tx: TxTrustSet.TransactionType,
        status: res2.result.meta.TransactionResult,
        hash: res2.result.hash
    })

    // issuer send token to the holder via the trust line (this is minting tokens)
    const TxPayment = {
        TransactionType: "Payment",
        Account: issuer.address,
        Destination: holder.address,
        Amount: {
            currency,
            issuer: issuer.address,
            value: "20",
        },
    };

    const res3 = await client.submitAndWait(TxPayment, {wallet: issuer});

    console.log({
        tx: TxPayment.TransactionType,
        status: res3.result.meta.TransactionResult,
        hash: res3.result.hash,
    });


    // verify IOU balance on the holder
    const res4 = await client.request({
        command: "account_lines",
        account: holder.address,
        peer: issuer.address,
    })

    console.log({
        output: res4.result.lines,
    })
    // or
    console.log({
        balance: res4.result.lines[0].balance,
        currency: res4.result.lines[0].currency,
        account: res4.result.lines[0].account,
    })


    // disconnect testnet
    await client.disconnect();
};

main();