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


// NFT = 0xc81FF3A3ad36990B5a8e592c9DF6745542c9F752
// Token = 0x4f7d9d5525308f72214d347C12b3f4b6B6C2c789
// Staking = 0x237004F677e4c463Dc48F22307720a0567696a2d