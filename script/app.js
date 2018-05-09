let fs = require('fs');
let csv = require('fast-csv');
let contract = require('truffle-contract');
let Web3 = require('web3');
let HDWalletProvider = require('truffle-hdwallet-provider');
let dotenv = require('dotenv');
dotenv.config();

const AIRDROP_CONTROLLER = require('../build/contracts/AirdropController.json');
const ropsten_infura_server = process.env.ROPSTEN_INFURA_SERVER;
const rinkeby_infura_server = process.env.RINKEBY_INFURA_SERVER;
const main_infura_server = process.env.MAINNET_INFURA_SERVER;
const mnemonic = process.env.MNEMONIC;

let batchSize = process.env.BATCH_SIZE;
let gasPrice = process.env.GAS_PRICE;
let gasLimit = process.env.GAS_LIMIT;
let contractAddress = process.env.CONTRACT_ADDRESS;
let csvFileName = 'data.csv';

let timeout = process.env.TIME_OUT;
// Calculate number of iterations to enforce timeout
timeout = (timeout - 4) * 60 / 10;


let provider = new HDWalletProvider(mnemonic, rinkeby_infura_server);  // change to main_infura_server
let web3 = new Web3(provider);
var owner = provider.address;

const airdropController = contract(AIRDROP_CONTROLLER);
airdropController.setProvider(provider);

async function parseFile(airdropContractOwner, airdropContractAddress, filename) {
    let stream = fs.createReadStream("../data/" + filename);
    let index = 0;
    let batch = 0;
    let failedAddresses = 0;
    let failedNumbers = 0;
    let addresses = new Array();
    let tokenAmounts = new Array();
    let dynamic = false;
    var airdropperInstance = null;

    console.log(`+++++ Spinning up airdropper +++++`)

    try {
        airdropperInstance = await airdropController.at(airdropContractAddress)
    } catch (err) {
        if (err == ReferenceError) {
            console.log('First run truffle migrate');
            return false;
        }
    }

    let csvStream = csv()
        .on("data", function (data) {
            let address = data[0];
            let isAddress = web3.utils.isAddress(address);
            let numTokens = 0;

            if (data.length > 1) {
                numTokens = data[1];
                dynamic = true;
            }

            if (isAddress) {
                addresses.push(address);

                if (dynamic && !isNaN(numTokens)) {
                    tokenAmounts.push(parseFloat(numTokens));
                }

            } else {
                failedAddresses++;
                console.warn(`Invalid address: ${address}`);
            }
        })
        .on("end", async function () {
            console.log(`Finished parsing file`)
            console.log(`Parsed ${addresses.length} addresses`)
            console.log(`Failed to parse ${failedAddresses} addresses`)
            console.log(`Failed to parse ${failedNumbers} token numbers`)
            console.log(`================================================`)
            console.log(`Gas price set to ${web3.utils.fromWei(gasPrice + '', 'gwei')} gwei for batch transactions`);
            console.log(`Batch size is ${batchSize} addresses per transaction`);
            console.log(`Airdropper address is ${airdropContractAddress}`)
            console.log(`Owner address is ${airdropContractOwner}`)
            console.log(`================================================`)

            let batch = [];
            let batchAmounts = [];
            let currentBatch = 0;
            let alreadyAllocated = 0;

            try {
                for (let index in addresses) {
                    let address = addresses[index];
                    let amount = tokenAmounts[index];
                    receivedTokens = await airdropperInstance.tokenReceived(address);

                    if (!receivedTokens) {
                        batch.push(address);
                        batchAmounts.push(amount);
                    } else {
                        alreadyAllocated++;
                    }

                    if (batch.length >= batchSize || index === addresses.length - 1) {
                        let batchesRemaining = (addresses.length - alreadyAllocated) / batchSize;
                        console.log(batchesRemaining);

                        console.log(`+ Airdropper allocating batch ${++currentBatch}/${parseInt(batchesRemaining)}`);

                        res = await allocateTokens(airdropperInstance, owner, batch, batchAmounts);

                        if (!res) {
                            throw new Error('Transfer failed');
                        }

                        console.log(`- Airdropper successfully allocated tokens to batch ${currentBatch}/${parseInt(batchesRemaining)}`)

                        batch = [];
                        batchAmounts = [];
                    }
                }
            } catch (err) {
                throw err;
            }

        });
    stream.pipe(csvStream);
}

async function allocateTokens(airdropper, owner, batch, tokenAmounts) {
    try {
        if (tokenAmounts.length > 0) {
            // Dynamic
            console.log(batch);
            es = await airdropper.airdrop(batch, tokenAmounts, { from: owner });
        }
        return true;

    } catch (err) {
        if (err == ReferenceError) {
            console.log('First run truffle migrate');
            return false;
        }
        if (err.toString().indexOf('240 seconds') > -1) {
            console.warn(`Transaction has not been included in any blocks within 240 seconds, this is likely due to a low gas price or a loss of internet connectivity. Waiting a bit longer...`);
            let iterations = 0;

            while (!(await airdropper.tokenReceived(batch[0]))) {

                if (iterations >= timeout) {
                    console.log(`Failed to include transaction within ${timeout} minutes, bailing as there may be a problem.`);
                    return false;
                }

                function pause(milliseconds) {
                    var dt = new Date();
                    while ((new Date()) - dt <= milliseconds) { }
                }

                // Wait 10 seconds before checking if anything has changed.
                pause(10000);
                iterations++;
            }
            console.log(`Success! Managed to include batch in a block. Continuing.`);
            return true;
        } else {
            console.error(`\n\nError while allocating tokens to batch. Bailing.\n`)
            console.error(err);
            return false;
        }
    }
}

// main command
// warning: you should set token address before call this function
// and send enough tokens to the contract
parseFile(owner, contractAddress, csvFileName);