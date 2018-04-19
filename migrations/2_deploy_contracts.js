let web3 = require('web3')
let AirdropController = artifacts.require("./AirdropController.sol");

module.exports = function (deployer, network) {
    deployer.deploy(AirdropController);
};