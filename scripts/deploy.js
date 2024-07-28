const { ethers,upgrades } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Deploy DZapNFTs contract
    const NFT = await ethers.getContractFactory('DZapNFTs');
    const nft = await NFT.deploy();
    await nft.waitForDeployment();
    console.log('DZapNFTs deployed to:',await nft.getAddress());
    const nftAddress = await nft.getAddress();
    
    // Deploy DZapToken contract
    const Token = await ethers.getContractFactory('DZapToken');
    const token = await Token.deploy();
    await token.waitForDeployment();
    console.log('DZapToken deployed to:', await token.getAddress());

    const tokenAddress = await token.getAddress();

    const Staking = await ethers.getContractFactory('Staking');
    const staking = await upgrades.deployProxy(Staking, [
       nftAddress,
       tokenAddress,
       2,
       60,
       60
    ]);
    
    await staking.waitForDeployment();

    console.log(await staking.getAddress());

    // Example interaction with the deployed contracts
    const owner = await nft.owner();
    console.log('Owner of DZapNFTs:', owner);

    // Example interaction with the deployed DZapToken contract
    const totalSupply = await token.totalSupply();
    console.log('Total supply of DZapToken:', totalSupply.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });


// NFT = 0x130Aa5BF197F44D84f7cAb7A8B2d6C5Ea1006C97
// Token = 0x87786C2B71CfB1E77EcEC23E9dc93047E6b1e56b
// Staking = 0xC447dd59D6A9C3A385516B4D52675b791355C003