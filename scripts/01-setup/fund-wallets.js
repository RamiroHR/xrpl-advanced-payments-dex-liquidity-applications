import { Client } from "xrpl";

const client = new Client("wss://s.altnet.rippletest.net:51233");

async function main() {
    // connect to testnet
    await client.connect();
    
    // test connectio to testnet
    console.log("Connected to testnet");
    
    // fund wallets and log output
    const {wallet, balance} = await client.fundWallet()
    console.log({
        address_01: wallet.address,
        seed_01: wallet.seed,
        balance
    })

    // fund a second wallet
    const {wallet: wallet_02, balance: balance_02} = await client.fundWallet();
    console.log({
        address_02: wallet_02.address,
        seed_02: wallet_02.seed,
        balance_02
    })

    await client.disconnect();
}

main();