import {Client, Wallet, xrpToDrops} from "xrpl";
import dotenv from "dotenv";

dotenv.config();

const client = new Client("wss://s.altnet.rippletest.net:51233");

async function main() {

    // connect to testnet
    await client.connect();
    console.log("Connected to Testnet")
    
    // Set existing token and respective issuer
    const currency = "RHR";
    const issuer = Wallet.fromSeed(process.env.SEED_03);
    console.log({
        step: "load token and issuer",
        token: currency,
        issuer: issuer.address,
    })

    // Create AMM
    const txAmmCreate = {
        TransactionType: "AMMCreate",
        Account: issuer.address,
        Amount: {
            currency,
            issuer: issuer.address,
            value: "200",
        },
        Amount2: xrpToDrops(10),
        TradingFee:500,
    }

    const resAmmCreate = await client.submitAndWait(txAmmCreate, {wallet: issuer});
    console.log({
        step:"create AMM",
        status: resAmmCreate.result.meta.TransactionResult,
        hash: resAmmCreate.result.hash,
    })


    // read AMM pool infor from testnet
    const ammInfo = await client.request({
        command: "amm_info",
        asset: {
            currency,
            issuer: issuer.address,
        },
        asset2: {
            currency: "XRP",
        },
    })

    console.log({
        step: "get amm info",
        amm_info: ammInfo.result.amm,
    });


    // disconnect from testnet
    await client.disconnect();
    console.log("Disconnected from Testnet")
};

main();