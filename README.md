## Airdrop Controller for ERC20 tokens

#### After you install truffle and npm packages

1. Confirm you have token contract deployed to mainnet

2. copy .env.example to .env

3. Set Mnemonic and infura url in .env -> this is important start

4. Decide which network you will use; mainnet, rinkeby, ropsten
   in app.js you need to change line 26;
    let provider = new HDWalletProvider(mnemonic, rinkeby_infura_server);
   if you choose Mainnet, change this to main_infura_server

5. truffle compile

6. deploy airdrop controller
   truffle migrate
   if you are using testnet,
   truffle migrate --network rinkeby

7. set contract address to .env file

8. set token address in AirdropController smart contract

9. transfer enough token to AidropController

10. in truffle console
   exec script/app.js