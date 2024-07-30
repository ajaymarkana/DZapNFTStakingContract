// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking is Initializable, OwnableUpgradeable, UUPSUpgradeable, PausableUpgradeable {
   
    IERC20 public rewardTokens;
    IERC721 public stakingNFT;

    uint256 public unbondingPeriod;
    uint256 public rewardDelay;

    // Structure for storing rewards
    struct RewardPerBlock {
        uint256 rewardAmount;
        uint256 updatedAt;
    }

    // Structure to store data of staker
    struct StakerData{
        uint256 stakedAtBlockNumber;
        uint256 stakedAt;
        uint256 reward;
        uint256 lastClaimedBlockNumber; 
        uint256 lastClaimedAt;
        bool isUnbonding;
        uint256 unStakedAt;
        uint256 unstakedAtBlockNumber;
    }

    RewardPerBlock[] public rewardPerBlock;

    mapping(address => mapping (uint256  => StakerData)) public stake;

    mapping (address => uint256[]) public userStakedNFTs;

    event stakedNFT(address indexed NFTStaker,uint256 StakedNFT);
    event unstakedNFT(address indexed NFTUnstaker,uint256 unStakedNFT);
    event claimedRewards(address indexed claimer,uint256 amount);
    event NFTWithdraw(address indexed withdrawer,uint256 nftId);

    function initialize(address _stakingNFT,address _rewardToken,uint256 _rewardPerBlock,uint256 _unbondingPeriod,uint256 _rewardDelay) initializer public {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        stakingNFT = IERC721(_stakingNFT);
        rewardTokens = IERC20(_rewardToken);

        rewardPerBlock.push(RewardPerBlock({
            rewardAmount: _rewardPerBlock,
            updatedAt: block.number
        }));
        unbondingPeriod = _unbondingPeriod;
        rewardDelay = _rewardDelay;

    }

    // Function to stake NFT 
    function stakeNFT(uint256 nftId) external whenNotPaused {
        StakerData storage stakeData = stake[msg.sender][nftId];

        require(stakeData.stakedAtBlockNumber == 0,"NFT is already staked");

        stakingNFT.transferFrom(msg.sender, address(this), nftId);

        stakeData.stakedAtBlockNumber = block.number;
        stakeData.stakedAt = block.timestamp;
        stakeData.lastClaimedBlockNumber = block.number;
        stakeData.lastClaimedAt = block.timestamp;

        userStakedNFTs[msg.sender].push(nftId);

        emit stakedNFT(msg.sender,nftId);
    }

    // Function to unstake NFT
    function unstake(uint256 nftId) external whenNotPaused {
        StakerData storage stakeData = stake[msg.sender][nftId];

        require(stakeData.stakedAtBlockNumber != 0,"NFT is not staked");

        require(!stakeData.isUnbonding,"NFT is already unstaked");

        stakeData.isUnbonding = true;
        stakeData.unStakedAt  = block.timestamp;
        stakeData.unstakedAtBlockNumber = block.number;

        emit unstakedNFT(msg.sender,nftId);
    }

    // Function to withdraw NFT after user stake NFT
    function withdrawNFT(uint256 nftId) external {
        StakerData storage stakeData = stake[msg.sender][nftId];

        require(stakeData.stakedAtBlockNumber != 0,"NFT us not staked");

        require(stakeData.isUnbonding,"you can not withdraw staked nft");

        uint256 unstakeDelayPeriod = stakeData.unStakedAt + unbondingPeriod;

        require(unstakeDelayPeriod < block.timestamp,"you can withdraw nft after unbonding period");

        _removeNFTFromStakedArray(msg.sender, nftId);
        stakingNFT.transferFrom(address(this), msg.sender, nftId);

        emit NFTWithdraw(msg.sender, nftId);
    }

    // Function to claim user rewards
    function claimReward() external whenNotPaused {
        uint256 totalReward = 0;

        uint256[] storage stakedNFTs = userStakedNFTs[msg.sender];

        for(uint256 i = 0;i< stakedNFTs.length;i++){
            uint256 tokenId = stakedNFTs[i];
            StakerData storage stakeInfo = stake[msg.sender][tokenId];

            uint256 delayedPeriod = stakeInfo.lastClaimedAt + rewardDelay;

            require(delayedPeriod < block.timestamp,"your delayed period is not over");

            totalReward += _calculateReward(msg.sender, tokenId);
            stakeInfo.lastClaimedAt = block.timestamp;
            stakeInfo.lastClaimedBlockNumber = block.number;
        }

         require(totalReward > 0, "No rewards to claim");

        rewardTokens.transfer(msg.sender, totalReward);

        emit claimedRewards(msg.sender, totalReward);

    }

    // Function to calculate rewards of perticular user
    function _calculateReward(address _staker,uint256 nftId) internal view returns(uint256){
        StakerData storage stakeData = stake[_staker][nftId];

        uint256 fromBlock = stakeData.lastClaimedBlockNumber;
        uint256 toBlock = stakeData.isUnbonding ? stakeData.unstakedAtBlockNumber : block.number;

        return calculateRewardBetweenBlocks(fromBlock, toBlock);
    }

    // Function to calculate rewards between blocks
     function calculateRewardBetweenBlocks(uint256 _from, uint256 _to) internal view returns (uint256) {
        uint256 reward = 0;
        uint256 length = rewardPerBlock.length;

        for (uint256 i = length - 1; i >= 0; i--) {
            if (_to >= rewardPerBlock[i].updatedAt) {
                uint256 applicableFromBlock = _from > rewardPerBlock[i].updatedAt ? _from : rewardPerBlock[i].updatedAt;
                reward += (_to - applicableFromBlock) * rewardPerBlock[i].rewardAmount;
                _to = rewardPerBlock[i].updatedAt;

                if (_to <= _from) {
                    break;
                }
            }
        }

        return reward;
    }

    // Internal function which removes nftId from user staked NFT array
    function _removeNFTFromStakedArray(address staker, uint256 nftId) internal {
        uint256[] storage stakedNFTs = userStakedNFTs[staker];
        uint256 length = stakedNFTs.length;
        bool found = false;

        for (uint256 i = 0; i < length; i++) {
            if (stakedNFTs[i] == nftId) {
                if (i < length - 1) {
                    stakedNFTs[i] = stakedNFTs[length - 1];
                }
                stakedNFTs.pop();
                found = true;
                break;
            }
        }
        
        require(found, "NFT ID not found in the staked list");
    }


    // Function to update reward per block
    // only called by contract admin
    function updateRewardPerBlock(uint256 _newRewardPerBlock) external onlyOwner {
        rewardPerBlock.push(RewardPerBlock({
            rewardAmount: _newRewardPerBlock,
            updatedAt: block.number
        }));
    }

    // Function to update unbonding period
    // only called by contract admin
    function updateUnbondingPeriod(uint256 _unbondingPeriod) external onlyOwner{
        unbondingPeriod = _unbondingPeriod;
    }

    // Function to update reward delay
    // only called by contract admin
    function updateRewardDelay(uint256 _rewardDelay) external onlyOwner{
        rewardDelay = _rewardDelay;
    }

    //Function to pause contract
    function pause() external onlyOwner {
        _pause();
    }

    //Function to unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }

    //Function to update new contract implementation address
    //only called by contract admin
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
