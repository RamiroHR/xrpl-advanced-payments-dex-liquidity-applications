import { Client, Wallet, xrpToDrops } from "xrpl";
import dotenv from "dotenv";

// load env vars
dotenv.config();

const client = new Client("wss://s.altnet.rippletest.net:51233");

async function main() {
    await client.connect();

    // test connection
    console.log("Connected to testnet");

    // instantiate the wallets from seeds on .env
    const wallet01 = Wallet.fromSeed(process.env.SEED_01); 
    const wallet02 = Wallet.fromSeed(process.env.SEED_02);
    console.log({
        address_01: wallet01.address,
        address_02: wallet02.address
    });

    // read balances (initial)
    const balance01_before = await client.getXrpBalance(wallet01.address);
    const balance02_before = await client.getXrpBalance(wallet02.address);
    console.log({
        balance01_before,
        balance02_before
    });

    // payment wallet 01 -> wallet 02
    const payment = {
        TransactionType: "Payment",
        Account: wallet01.address,
        Destination: wallet02.address,
        Amount: xrpToDrops(1)
    };

    const res = await client.submitAndWait(payment, { wallet: wallet01 } );
    console.log({
        status: res.result.meta.TransactionResult,
        hash: res.result.hash
    });

    // balances after
    const balance01_after = await client.getXrpBalance(wallet01.address);
    const balance02_after = await client.getXrpBalance(wallet02.address);
    console.log({
        balance01_after,
        balance02_after 
    })

    await client.disconnect();
}

main();