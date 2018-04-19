var dotenv = require("dotenv");
var HDWalletProvider = require("truffle-hdwallet-provider");

dotenv.config();

var ropsten_infura_server = process.env.ROPSTEN_INFURA_SERVER;
var rinkeby_infura_server = process.env.RINKEBY_INFURA_SERVER;
var mnemonic = process.env.MNEMONIC;

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4704587

    },
    ropsten: {
      provider: function () {
          return new HDWalletProvider(mnemonic, ropsten_infura_server);
      },
      network_id: 3,
      gas: 4704587
    },
    rinkeby: {
        provider: function () {
            return new HDWalletProvider(mnemonic, rinkeby_infura_server);
        },
        network_id: 4,
        gas: 4704587
    }
  }
};
