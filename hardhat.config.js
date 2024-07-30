require("@nomicfoundation/hardhat-toolbox");
// require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

// WALLET_KEY = 
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [`${process.env.ACCOUNT_PRIVATE_KEY}`],
    },
  },
};
