const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

let Staking,
  staking,
  rewardToken,
  nft,
  owner,
  user,
  other,
  nftAddress,
  tokenAddress,
  stakingAddress;

beforeEach(async () => {
  [owner, user, other] = await ethers.getSigners();

  // Deploy Mock ERC20 Token for Rewards
  const Token = await ethers.getContractFactory('DZapToken');
  rewardToken = await Token.deploy();
  await rewardToken.waitForDeployment();

  // Deploy Mock ERC721 NFT for Staking
  const NFT = await ethers.getContractFactory('DZapNFTs');
  nft = await NFT.deploy();
  await nft.waitForDeployment();

  // Mint NFTs for testing
  await nft.safeMint(user.address);
  await nft.safeMint(user.address);

  nftAddress = await nft.getAddress();
  tokenAddress = await rewardToken.getAddress();

  console.log('NFT =', nftAddress);
  console.log('Token =', tokenAddress);
  // NFT = 0xc81FF3A3ad36990B5a8e592c9DF6745542c9F752
  // Token = 0x4f7d9d5525308f72214d347C12b3f4b6B6C2c789
  // Staking = 0x237004F677e4c463Dc48F22307720a0567696a2d

  // Deploy Staking Contract
  Staking = await ethers.getContractFactory('Staking');
  staking = await upgrades.deployProxy(Staking, [
      nftAddress,
      tokenAddress,
      '2',
      '600',
      '600',
  ]);
  await staking.waitForDeployment();

  stakingAddress = await staking.getAddress();

  // Transfer reward tokens to staking contract

  await rewardToken.transfer(stakingAddress, 1000);
});

describe('Initialization', async function () {
  it('should initialize with correct values', async function () {
      expect(await staking.stakingNFT()).to.equal(nftAddress);
      expect(await staking.rewardTokens()).to.equal(tokenAddress);
      expect(await staking.unbondingPeriod()).to.equal(BigInt(600));
      expect(await staking.rewardDelay()).to.equal(BigInt(600));
      expect((await staking.rewardPerBlock(0)).rewardAmount).to.equal(
          BigInt(2)
      );
  });
});

describe('Stake', async function () {
  it('should hava reward token balance', async function () {
      expect(await rewardToken.balanceOf(stakingAddress)).to.equal(
          BigInt(1000)
      );
  });

  it('should user have NFTs', async function () {
      expect(await nft.balanceOf(user.address)).to.equal(BigInt(2));
  });

  it('should allow a user to stake an NFT', async function () {
      await nft.connect(user).setApprovalForAll(stakingAddress, true);
      expect(
          await nft.isApprovedForAll(user.address, stakingAddress)
      ).to.equal(true);
      await staking.connect(user).stakeNFT(1);

      const stakerData = await staking.stake(user.address, 1);
      expect(stakerData.stakedAtBlockNumber).to.be.gt(0);
      expect(stakerData.isUnbonding).to.be.false;
  });
});

describe('Unstake', async function () {
  it('should allow a user to unstake an NFT', async function () {
      await nft.connect(user).setApprovalForAll(stakingAddress, true);
      await staking.connect(user).stakeNFT(1);
      await staking.connect(user).unstake(1);

      const stakerData = await staking.stake(user.address, 1);
      expect(stakerData.isUnbonding).to.be.true;
  });


  it('should allow a user to withdraw an unstaked NFT after the unbonding period', async function () {
      await nft.connect(user).setApprovalForAll(stakingAddress, true);
      await staking.connect(user).stakeNFT(1);
      await staking.connect(user).unstake(1);

      // Simulate time passing for the unbonding period
      await ethers.provider.send('evm_increaseTime', [100]);
      await ethers.provider.send('evm_mine');

      await helpers.time.increase(5 * 60 * 60); // Increase time by 5 hours (18,000 seconds)

      await staking.connect(user).withdrawNFT(1);

      expect(await nft.ownerOf(1)).to.equal(user.address);
  });

  it('should not allow a user to withdraw an unstaked NFT before the unbonding period', async function () {
      await nft.connect(user).setApprovalForAll(stakingAddress, true);
      await staking.connect(user).stakeNFT(1);
      await staking.connect(user).unstake(1);

      await expect(staking.connect(user).withdrawNFT(1)).to.be.revertedWith(
          'you can withdraw nft after unbonding period'
      );
  });

});

describe('Claim rewards',async function() {
    it('should allow a user to claim rewards', async function () {
      await nft.connect(user).setApprovalForAll(stakingAddress, true);
      await staking.connect(user).stakeNFT(1);

      // Simulate some blocks passing
      await ethers.provider.send('evm_mine');
      await ethers.provider.send('evm_mine');

      await helpers.time.increase(5 * 60 * 60); // Increase time by 5 hours (18,000 seconds)
      await staking.connect(user).claimReward();

      const balance = await rewardToken.balanceOf(user.address);
      expect(balance).to.be.gt(0);
  });

  it('should correctly calculate rewards with changing reward per block', async function () {
      await nft.connect(user).setApprovalForAll(stakingAddress, true);
      await staking.connect(user).stakeNFT(1);

      // Simulate some blocks passing
      await ethers.provider.send('evm_mine');
      await ethers.provider.send('evm_mine');

      // Update reward per block
      await staking.connect(owner).updateRewardPerBlock(5);

      // Simulate more blocks passing
      await ethers.provider.send('evm_mine');
      await ethers.provider.send('evm_mine');

      await helpers.time.increase(5 * 60 * 60); // Increase time by 5 hours (18,000 seconds)

      await staking.connect(user).claimReward();

      const balance = await rewardToken.balanceOf(user.address);
      expect(balance).to.be.gt(0); // Adjust this based on expected reward calculations
  });

})

describe('Puase and unpause',async function(){
  it('should allow the owner to pause and unpause the contract', async function () {
    await staking.connect(owner).pause();
    expect(await staking.paused()).to.be.true;

    await staking.connect(owner).unpause();
    expect(await staking.paused()).to.be.false;
});

it('should not allow non-owners to pause the contract', async function () {
    await expect(
        staking.connect(user).pause()
    ).to.be.revertedWithCustomError(
        staking,
        'OwnableUnauthorizedAccount'
    );
});
})

describe('Update rewards',async function(){
  it('should allow the owner to update reward parameters', async function () {
    await staking.connect(owner).updateUnbondingPeriod(200);
    expect(await staking.unbondingPeriod()).to.equal(200);

    await staking.connect(owner).updateRewardDelay(100);
    expect(await staking.rewardDelay()).to.equal(100);
});

it('should not allow non-owners to update reward parameters', async function () {
    await expect(
        staking.connect(user).updateUnbondingPeriod(200)
    ).to.be.revertedWithCustomError(staking,"OwnableUnauthorizedAccount");
    await expect(
        staking.connect(user).updateRewardDelay(100)
    ).to.be.revertedWithCustomError(staking,"OwnableUnauthorizedAccount");
});
})
