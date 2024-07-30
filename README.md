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
   git clone <repository-url>
   cd <repository-name>

npm install

npx hardhat compile

npx hardhat run scripts/deploy.js --network <network-name>


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


### 7. **Contributing**

```markdown
## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes and commit them with a descriptive message.
4. Push your changes to your forked repository.
5. Submit a pull request.

Please ensure your code follows the project's coding standards and includes relevant tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgements

- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/) for secure and efficient smart contract implementations.
- The [Hardhat](https://hardhat.org/) team for their excellent development environment.
