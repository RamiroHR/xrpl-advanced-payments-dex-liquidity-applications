import { Client, Wallet, xrpToDrops } from "xrpl";
import dotenv from "dotenv";

dotenv.config();

const client = new Client("wss://s.altnet.rippletest.net:51233");

async function main() {
    
    await client.connect();
    console.log("connected to testnet");

    // load currency and issuer
    const token = "RHR";
    const issuer = Wallet.fromSeed(process.env.SEED_03);
    console.log({
        currency: token,
        issuer: issuer.address,
    });

    // get AMM info before anything
    const resAmmInfo = await client.request({
        command: "amm_info",
        asset: {
            currency: token,
            issuer: issuer.classicAddress,
        },
        asset2: {
            currency: "XRP",
        },
    })
    console.log({
        amm_info: resAmmInfo.result.amm
    })


    // Add liquidity to the pool (both assets)
    const TxAmmDeposit = {
        TransactionType: "AMMDeposit",
        Account: issuer.address,
        Asset: {
            currency: token,
            issuer: issuer.address,

        },
        Asset2: {
            currency: "XRP",
        },
        Amount: {
            currency: token,
            issuer: issuer.address,
            value: "300"
        },
        Amount2: xrpToDrops("15"),
        Flags: 0x00100000, //tfTwoAsset flag value
    };

    const resAmmDeposit = await client.submitAndWait(TxAmmDeposit, {wallet: issuer});

    console.log({
        step: "Add liquidity to AMM",
        status: resAmmDeposit.result.meta.TransactionResult,
        hash: resAmmDeposit.result.hash,
    });


    // disconnect from testnet
    await client.disconnect();
    console.log("disconnected to testnet");
};

main();