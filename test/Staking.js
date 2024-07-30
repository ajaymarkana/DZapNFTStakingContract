const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Staking Contract", function () {
  let Staking, staking, rewardToken, nft, owner, user, other;

  beforeEach(async () => {
    [owner, user, other] = await ethers.getSigners();

    // Deploy Mock ERC20 Token for Rewards
    const Token = await ethers.getContractFactory("DZapToken");
    rewardToken = await Token.deploy("DZap Reward Token", "DRT", ethers.utils.parseEther("10000"));
    await rewardToken.deployed();

    // Deploy Mock ERC721 NFT for Staking
    const NFT = await ethers.getContractFactory("DZapNFTs");
    nft = await NFT.deploy("DZap NFT", "DNFT");
    await nft.deployed();

    // Mint NFTs for testing
    await nft.mint(user.address, 1);
    await nft.mint(user.address, 2);

    
// NFT = 0xc81FF3A3ad36990B5a8e592c9DF6745542c9F752
// Token = 0x4f7d9d5525308f72214d347C12b3f4b6B6C2c789
// Staking = 0x237004F677e4c463Dc48F22307720a0567696a2d

    // Deploy Staking Contract
    Staking = await ethers.getContractFactory("Staking");
    staking = await upgrades.deployProxy(Staking, [nft.address, rewardToken.address, ethers.utils.parseEther("10"), 100, 50], { initializer: 'initialize' });
    await staking.deployed();

    // Transfer reward tokens to staking contract
    await rewardToken.transfer(staking.address, ethers.utils.parseEther("1000"));
  });


  describe("Initialization", function () {
    it("should initialize with correct values", async function () {
   
      expect(await staking.stakingNFT()).to.equal(nft.address);
      expect(await staking.rewardTokens()).to.equal(rewardToken.address);
      expect(await staking.unbondingPeriod()).to.equal(100);
      expect(await staking.rewardDelay()).to.equal(50);
      expect((await staking.rewardPerBlock(0)).rewardAmount).to.equal(ethers.utils.parseEther("10"));
    });
  });

  describe("Staking and Unstaking", function () {
    it("should allow a user to stake an NFT", async function () {
      await nft.connect(user).approve(staking.address, 1);
      await staking.connect(user).stakeNFT(1);

      const stakerData = await staking.stake(user.address, 1);
      expect(stakerData.stakedAtBlockNumber).to.be.gt(0);
      expect(stakerData.isUnbonding).to.be.false;
    });

    it("should allow a user to unstake an NFT", async function () {
      await nft.connect(user).approve(staking.address, 1);
      await staking.connect(user).stakeNFT(1);
      await staking.connect(user).unstake(1);

      const stakerData = await staking.stake(user.address, 1);
      expect(stakerData.isUnbonding).to.be.true;
    });
  });

  describe("Claiming Rewards", function () {
    it("should allow a user to claim rewards", async function () {
      await nft.connect(user).approve(staking.address, 1);
      await staking.connect(user).stakeNFT(1);

      // Simulate some blocks passing
      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");

      await staking.connect(user).claimReward();

      const balance = await rewardToken.balanceOf(user.address);
      expect(balance).to.be.gt(0);
    });

    it("should correctly calculate rewards with changing reward per block", async function () {
      await nft.connect(user).approve(staking.address, 1);
      await staking.connect(user).stakeNFT(1);

      // Simulate some blocks passing
      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");

      // Update reward per block
      await staking.connect(owner).updateRewardPerBlock(ethers.utils.parseEther("5"));

      // Simulate more blocks passing
      await ethers.provider.send("evm_mine");
      await ethers.provider.send("evm_mine");

      await staking.connect(user).claimReward();

      const balance = await rewardToken.balanceOf(user.address);
      expect(balance).to.be.gt(0); // Adjust this based on expected reward calculations
    });
  });

  describe("Withdrawing NFTs", function () {
    it("should allow a user to withdraw an unstaked NFT after the unbonding period", async function () {
      await nft.connect(user).approve(staking.address, 1);
      await staking.connect(user).stakeNFT(1);
      await staking.connect(user).unstake(1);

      // Simulate time passing for the unbonding period
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine");

      await staking.connect(user).withdrawNFT(1);

      expect(await nft.ownerOf(1)).to.equal(user.address);
    });

    it("should not allow a user to withdraw an unstaked NFT before the unbonding period", async function () {
      await nft.connect(user).approve(staking.address, 1);
      await staking.connect(user).stakeNFT(1);
      await staking.connect(user).unstake(1);

      await expect(staking.connect(user).withdrawNFT(1)).to.be.revertedWith("you can withdraw nft after unbonding period");
    });
  });

  describe("Admin Functions", function () {
    it("should allow the owner to pause and unpause the contract", async function () {
      await staking.connect(owner).pause();
      expect(await staking.paused()).to.be.true;

      await staking.connect(owner).unpause();
      expect(await staking.paused()).to.be.false;
    });

    it("should not allow non-owners to pause the contract", async function () {
      await expect(staking.connect(user).pause()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should allow the owner to update reward parameters", async function () {
      await staking.connect(owner).updateUnbondingPeriod(200);
      expect(await staking.unbondingPeriod()).to.equal(200);

      await staking.connect(owner).updateRewardDelay(100);
      expect(await staking.rewardDelay()).to.equal(100);
    });

    it("should not allow non-owners to update reward parameters", async function () {
      await expect(staking.connect(user).updateUnbondingPeriod(200)).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(staking.connect(user).updateRewardDelay(100)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
