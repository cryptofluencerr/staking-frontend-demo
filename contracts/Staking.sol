/*
    => Exclude from fees
    => Exclude from reward
    => CHANGE TIMINGS FOR CLIFF AND DURATION (TO DEPLOY MAIN-NET CONTRACT)

    Create a smart contract where the user will stake a custom ERC20 token and be 
    issued an NFT which will record the amount staked. The user will get a choice to 
    stake for either 2 weeks, 1 month and 2 months for 0.5%, 1% and 2% interest reward.

    When unstaking, the NFT will be burnt. If the user unstakes before the time specified
     when staking, then 10% penalty will be deducted from the initial staked amount otherwise 
     they will get the reward on the amount staked.
    
    Bonus:
    1. Write associated tests in Hardhat (use Chai J).

    2. Deploy the smart contract on polygon Mumbai testnet

    Send in the following by 11am IST 28/09/2022:
    1. A github link to the frontend repo made with React. You may use any style 
    engine but the repo should have a functioning React frontend which can be tested out 
    just running "npm run start".
    2. A github link to the hardhat project for the smart contract to evaluate the tests written.
    3. Link to the Deployed and Verified Smart contract on Polygon Mumbai testnet
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Staking is Ownable, ReentrancyGuard, ERC721 {
    using Address for address;
    using Counters for Counters.Counter;

    // address of the BEP20 tokens
    IERC20 private immutable _BUSD;
    address BUSD = 0x5f334FE815B5bA0238d62C0fd4B1271736c267F2;
    Counters.Counter private _tokenIdCount;
    // Struct for a specific staking schedule
    struct StakingSchedule {
        uint256 tokenId;
        address beneficiary;
        uint256 amountTotal;
        uint256 startTime;
        uint256 duration;
        uint256 released;
        string timeString;
        uint256 reward;
    }

    struct TimePeriod {
        uint256 stakeDuration;
        uint8 stakePercentage;
    }
    mapping(string => TimePeriod) public StakingDuration;

    uint256 private constant _decimals = 10 ** 18;
    mapping(address => StakingSchedule[]) public stakingSchedules;

    event stakingDone(
        address beneficiaryAddress,
        uint256 amount,
        uint256 startTime,
        uint256 durationOfVesting,
        uint256 released,
        string timeString
    );

    event Reward(
        address beneficiaryAddress,
        uint256 amount,
        uint256 reward,
        string timeString
    );
    event Penalty(
        address beneficiaryAddress,
        uint256 amount,
        uint256 reward,
        string timeString
    );
    event ReleasedAmount(address beneficiaryPayable, uint256 amount);
    event BUSDBalanceTransferToOwner(address owner, uint256 amount);
    event LANDSLeftoverBalanceWithdraw(address owner, uint256 amount);

    constructor() ERC721("Staking", "ST") {
        _BUSD = IERC20(BUSD);

        StakingDuration["week"].stakeDuration = 604800;
        StakingDuration["oneMonth"].stakeDuration = 2592000;
        StakingDuration["twoMonth"].stakeDuration = 2592000 * 2;

        StakingDuration["week"].stakePercentage = 50;
        StakingDuration["oneMonth"].stakePercentage = 100;
        StakingDuration["twoMonth"].stakePercentage = 200;
    }

    modifier check(string memory timeInString) {
        require(
            keccak256(abi.encodePacked(timeInString)) ==
                keccak256(abi.encodePacked("week")) ||
                keccak256(abi.encodePacked(timeInString)) ==
                keccak256(abi.encodePacked("oneMonth")) ||
                keccak256(abi.encodePacked(timeInString)) ==
                keccak256(abi.encodePacked("twoMonth")),
            "Check: Unrecognized time!"
        );
        _;
    }

    function staking(
        uint256 tokenAmount,
        string memory timeString
    ) public check(timeString) {
        _tokenIdCount.increment();
        uint256 newItemId = _tokenIdCount.current();
        uint256 totalStakingAmount = tokenAmount * _decimals;
        uint256 timeInSecs = returnTimingSchedule(timeString).stakeDuration;
        require(
            _BUSD.balanceOf(_msgSender()) >= totalStakingAmount,
            "Insufficient BUSD Balance, Add Funds to Start Staking!"
        );

        _BUSD.transferFrom(_msgSender(), address(this), totalStakingAmount);
        _BUSD.approve(address(this), totalStakingAmount);

        address beneficiary_ = _msgSender();
        uint256 startTime_ = block.timestamp;
        uint256 duration_ = startTime_ + timeInSecs; // Total Vesting Duration => 1 month (28927173)

        stakingSchedules[msg.sender].push(
            StakingSchedule(
                newItemId, // tokenId
                beneficiary_, // Address of the Invester
                totalStakingAmount, // Total amount of tokens that are to be alloted
                startTime_, // StartTime
                duration_, // Total Vesting Duration => 1 month
                0, //released
                timeString, // timeString
                0 // reward
            )
        );

        _mint(beneficiary_, newItemId);
        // setApprovalForAll(address(this),true);

        emit stakingDone(
            beneficiary_,
            totalStakingAmount,
            startTime_,
            duration_,
            0,
            timeString
        );
    }

    function release(uint256 index) public {
        StakingSchedule storage stake = stakingSchedules[_msgSender()][index];
        require(
            stake.amountTotal - stake.released > 0,
            "Release: Total amount already released!"
        );
        require(
            stake.released <= stake.amountTotal,
            "Release: Total amount already released!"
        );
        require(
            stake.beneficiary == _msgSender(),
            "Release: You are not the Owner!"
        );
        uint256 amountLeft = stake.amountTotal - stake.released;

        /** If current timestamp is smaller than the duration,
        it means that penalty needs to be charged */
        if (getCurrentTime() <= stake.duration) {
            uint256 penalty = (amountLeft * 1000) / 10000;
            uint256 finalAmountLeft = amountLeft - penalty;
            stake.released += amountLeft;

            _BUSD.transfer(stake.beneficiary, finalAmountLeft);
            _BUSD.approve(stake.beneficiary, finalAmountLeft);

            emit Penalty(
                stake.beneficiary,
                finalAmountLeft,
                penalty,
                stake.timeString
            );

            // burn the nft
        } else {
            uint256 percentage = returnTimingSchedule(stake.timeString)
                .stakePercentage;
            uint256 percentagePaid = (amountLeft * percentage) / 10000;
            uint256 finalAmountLeft = amountLeft + percentagePaid;

            stake.released += amountLeft;
            stake.reward += percentagePaid;

            _BUSD.transfer(stake.beneficiary, finalAmountLeft);
            _BUSD.approve(stake.beneficiary, finalAmountLeft);

            emit Reward(
                stake.beneficiary,
                amountLeft,
                percentagePaid,
                stake.timeString
            );
        }
        _burn(stake.tokenId);
    }

    function showStakes() public view returns (StakingSchedule[] memory) {
        return stakingSchedules[msg.sender];
    }

    function returnTimingSchedule(
        string memory timeInString
    ) public view returns (TimePeriod memory) {
        TimePeriod memory timingSchedule;
        require(
            keccak256(abi.encodePacked(timeInString)) ==
                keccak256(abi.encodePacked("week")) ||
                keccak256(abi.encodePacked(timeInString)) ==
                keccak256(abi.encodePacked("oneMonth")) ||
                keccak256(abi.encodePacked(timeInString)) ==
                keccak256(abi.encodePacked("twoMonth")),
            "Check: Unrecognized time!"
        );
        if (
            keccak256(abi.encodePacked(timeInString)) ==
            keccak256(abi.encodePacked("week"))
        ) {
            timingSchedule = StakingDuration["week"];
        }
        if (
            keccak256(abi.encodePacked(timeInString)) ==
            keccak256(abi.encodePacked("oneMonth"))
        ) {
            timingSchedule = StakingDuration["oneMonth"];
        }
        if (
            keccak256(abi.encodePacked(timeInString)) ==
            keccak256(abi.encodePacked("twoMonth"))
        ) {
            timingSchedule = StakingDuration["twoMonth"];
        }
        return timingSchedule;
    }

    function getCurrentTime() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}
