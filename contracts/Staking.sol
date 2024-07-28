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

    uint256 public rewardPerBlock;
    uint256 public unbondingPeriod;
    uint256 public rewardDelay;

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

        rewardPerBlock = _rewardPerBlock;
        unbondingPeriod = _unbondingPeriod;
        rewardDelay = _rewardDelay;

    }

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

    function unstake(uint256 nftId) external whenNotPaused {
        StakerData storage stakeData = stake[msg.sender][nftId];

        require(stakeData.stakedAtBlockNumber != 0,"NFT is not staked");

        require(!stakeData.isUnbonding,"NFT is already unstaked");

        stakeData.isUnbonding = true;
        stakeData.unStakedAt  = block.timestamp;
        stakeData.unstakedAtBlockNumber = block.number;

        emit unstakedNFT(msg.sender,nftId);
    }

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

    function _calculateReward(address _staker,uint256 nftId) internal view returns(uint256){
        StakerData storage stakeData = stake[_staker][nftId];
        uint256 blocksStaked = 0;

        if(stakeData.isUnbonding){
            blocksStaked = stakeData.unstakedAtBlockNumber - stakeData.lastClaimedBlockNumber;
        }else{
            blocksStaked = block.number - stakeData.lastClaimedBlockNumber;
        }

        return blocksStaked * rewardPerBlock;

    }

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


    function updateRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner{
        rewardPerBlock = _rewardPerBlock;
    }

    function updateUnbondingPeriod(uint256 _unbondingPeriod) external onlyOwner{
        unbondingPeriod = _unbondingPeriod;
    }

    function updateRewardDelay(uint256 _rewardDelay) external onlyOwner{
        rewardDelay = _rewardDelay;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
