# NFT Staking Contract

This project implements an NFT staking contract using Solidity, allowing users to stake their NFTs and earn ERC20 token rewards over time. The project is built with the Hardhat development environment and includes upgradeable smart contracts using the OpenZeppelin libraries.

## Features

- **Staking and Unstaking:** Users can stake and unstake NFTs.
- **Reward Calculation:** Users earn ERC20 token rewards for staking NFTs, with support for dynamic reward rates.
- **Withdrawals:** After an unbonding period, users can withdraw their unstaked NFTs.
- **Admin Controls:** The contract owner can pause/unpause the contract and update parameters like reward rates, unbonding periods, and reward delays.

## Installation and Setup

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Hardhat](https://hardhat.org/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ajaymarkana/DZapNFTStakingContract/tree/dev

2. Add .env file and add below variables
    ```bash
    INFURA_KEY
    ACCOUNT_PRIVATE_KEY  

3. Install NPM packages

    ```bash
    npm install

4. Compile smart contract

    ```bash
    npx hardhat compile

5. Deploy smart contract

    ```bash
    npx hardhat run scripts/deploy.js --network sepolia


### 4. **Testing**

```markdown
## Testing

This project uses [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/) for testing.

To run the tests, execute:

```bash
npx hardhat test


### 5. **Usage**

```markdown
## Usage

To interact with the deployed contract, you can use Hardhat tasks or a frontend interface that connects to the contract. Below are examples of common interactions:

### Staking an NFT

```javascript
const staking = await ethers.getContractAt("Staking", <staking_contract_address>);
await nft.approve(staking.address, tokenId);
await staking.stakeNFT(tokenId);

### 6. **Contract Upgrades**

```markdown
## Contract Upgrades

The project uses OpenZeppelin's UUPS (Universal Upgradeable Proxy Standard) pattern for contract upgrades. To upgrade the contract, deploy a new implementation and execute the upgrade function from the admin account:

```javascript
const newImplementation = await ethers.getContractFactory("NewStakingImplementation");
await upgrades.upgradeProxy(proxyAddress, newImplementation);

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgements

- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/) for secure and efficient smart contract implementations.
- The [Hardhat](https://hardhat.org/) team for their excellent development environment.
