require("@nomicfoundation/hardhat-toolbox");
// require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
// WALLET_KEY = 
const INFURA_API_KEY ='4cleh0fbv39Xl2ks/93NKMvczPw5/EiNrlREuQKW7+AwyA3cFwnp4w'
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/3e9c94a66c4e4cdd8f9b524b0874d830`,
      accounts: ["bbdb4944178268cd4f35d1a2a2439fa088da563963326ddf57e03a1222837a97"],
    },
  },
};
