// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoGoals {
    address public owner;
    uint32 public creationFeePercent = 30; // 0.3% (в базисных пунктах)
    uint32 public cancelFeePercent = 60; // 0.6% (в базисных пунктах)

    enum GoalType { COMMISSIONED, NO_COMMISSION }
    enum GoalStatus { PENDING, COMPLETED, FAILED }

    struct Goal {
        address creator;
        uint256 amount; // Для хранения суммы до ~79 триллионов в wei
        uint64 deadline;
        GoalType goalType;
        GoalStatus status;
    }

    mapping(uint32 => Goal) public goals; // До 4,2 миллиарда целей
    uint32 public goalCount; // Счётчик целей

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createGoal(uint64 _deadline, GoalType _goalType) external payable {
        require(msg.value > 0, "Deposit must be greater than zero");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        uint96 amountAfterFee = uint96(msg.value);
        if (_goalType == GoalType.COMMISSIONED) {
            uint96 creationFee = (amountAfterFee * creationFeePercent) / 10000;
            amountAfterFee -= creationFee;
            payable(owner).transfer(creationFee);
        }

        goals[goalCount] = Goal({
            creator: msg.sender,
            amount: amountAfterFee,
            deadline: _deadline,
            goalType: _goalType,
            status: GoalStatus.PENDING
        });

        goalCount++;
    }

    function completeGoal(uint32 _goalId) external {
        Goal storage goal = goals[_goalId];
        require(goal.status == GoalStatus.PENDING, "Goal is not pending");
        require(block.timestamp <= goal.deadline, "Deadline has passed");

        if (goal.goalType == GoalType.COMMISSIONED) {
            require(msg.sender == goal.creator, "Only the creator can complete this goal");

            uint96 completionFee = uint96((goal.amount * creationFeePercent) / 10000);
            uint96 payout = uint96(goal.amount - completionFee);

            goal.status = GoalStatus.COMPLETED;
            payable(owner).transfer(completionFee); // Комиссия владельцу контракта
            payable(goal.creator).transfer(payout); // Остаток создателю цели
        } else {
            require(msg.sender == owner, "Only the contract owner can complete this goal");

            goal.status = GoalStatus.COMPLETED;
            payable(goal.creator).transfer(goal.amount); // Вся сумма создателю цели
        }
    }

    function failGoal(uint32 _goalId) external onlyOwner {
        Goal storage goal = goals[_goalId];
        require(goal.status == GoalStatus.PENDING, "Goal is not pending");

        goal.status = GoalStatus.FAILED;

        // Все средства уходят владельцу контракта
        payable(owner).transfer(goal.amount);
    }

    function updateFeePercents(uint32 _creationFeePercent, uint32 _cancelFeePercent) external onlyOwner {
        require(_creationFeePercent <= 1000, "Creation fee cannot exceed 10%");
        require(_cancelFeePercent <= 2000, "Cancel fee cannot exceed 20%");

        creationFeePercent = _creationFeePercent;
        cancelFeePercent = _cancelFeePercent;
    }
}
