// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LazChain
 * @dev Smart contract for goal commitments on Metis testnet
 * Users can commit funds to personal goals and claim them based on completion status
 */
contract LazChain {
    address public owner;
    
    // Reentrancy guard
    bool private locked;
    
    struct Goal {
        address user;           // User who committed the funds
        uint256 amount;         // Amount committed (in native Metis)
        uint256 deadline;       // Timestamp deadline for the goal
        bool completed;         // Whether the goal is marked as completed
        bool validatedByAI;     // Whether validation was done by AI
        address recipient;      // Address to receive funds if goal fails
        bool claimed;           // Whether funds have been claimed
    }
    
    // Mapping from goal ID to Goal struct
    mapping(bytes32 => Goal) public goals;
    
    // Mapping to track existing goal IDs to prevent duplicates
    mapping(bytes32 => bool) public goalExists;
    
    // Events
    event GoalCommitted(
        bytes32 indexed goalId,
        address indexed user,
        uint256 amount,
        uint256 deadline,
        address recipient
    );
    
    event GoalCompleted(
        bytes32 indexed goalId,
        bool byAI
    );
    
    event GoalClaimed(
        bytes32 indexed goalId,
        address indexed claimant,
        uint256 amount,
        bool successful
    );
    
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "LazChain: caller is not the owner");
        _;
    }
    
    modifier nonReentrant() {
        require(!locked, "LazChain: reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    modifier validGoal(bytes32 goalId) {
        require(goalExists[goalId], "LazChain: goal does not exist");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    /**
     * @dev Commit funds to a personal goal
     * @param goalId Unique identifier for the goal
     * @param deadline Timestamp when the goal expires
     * @param recipient Address to receive funds if goal fails
     */
    function commitGoal(
        bytes32 goalId,
        uint256 deadline,
        address recipient
    ) external payable {
        require(msg.value > 0, "LazChain: must send native Metis");
        require(deadline > block.timestamp, "LazChain: deadline must be in the future");
        require(recipient != address(0), "LazChain: recipient cannot be zero address");
        require(!goalExists[goalId], "LazChain: goal ID already exists");
        
        goals[goalId] = Goal({
            user: msg.sender,
            amount: msg.value,
            deadline: deadline,
            completed: false,
            validatedByAI: false,
            recipient: recipient,
            claimed: false
        });
        
        goalExists[goalId] = true;
        
        emit GoalCommitted(goalId, msg.sender, msg.value, deadline, recipient);
    }
    
    /**
     * @dev Mark a goal as completed (only owner can call)
     * @param goalId The goal to mark as completed
     * @param byAI Whether the completion was validated by AI
     */
    function markCompleted(bytes32 goalId, bool byAI) external onlyOwner validGoal(goalId) {
        Goal storage goal = goals[goalId];
        require(!goal.completed, "LazChain: goal already completed");
        require(!goal.claimed, "LazChain: goal already claimed");
        require(block.timestamp <= goal.deadline, "LazChain: deadline has passed");
        
        goal.completed = true;
        goal.validatedByAI = byAI;
        
        emit GoalCompleted(goalId, byAI);
    }
    
    /**
     * @dev Claim funds after deadline
     * @param goalId The goal to claim funds for
     */
    function claim(bytes32 goalId) external nonReentrant validGoal(goalId) {
        Goal storage goal = goals[goalId];
        require(block.timestamp > goal.deadline, "LazChain: deadline has not passed");
        require(!goal.claimed, "LazChain: funds already claimed");
        
        goal.claimed = true;
        
        if (goal.completed) {
            // Goal was completed, return funds to user
            (bool success, ) = payable(goal.user).call{value: goal.amount}("");
            require(success, "LazChain: transfer to user failed");
            
            emit GoalClaimed(goalId, goal.user, goal.amount, true);
        } else {
            // Goal was not completed, send funds to recipient
            (bool success, ) = payable(goal.recipient).call{value: goal.amount}("");
            require(success, "LazChain: transfer to recipient failed");
            
            emit GoalClaimed(goalId, goal.recipient, goal.amount, false);
        }
    }
    
    /**
     * @dev Transfer ownership of the contract to a new owner
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "LazChain: new owner is the zero address");
        
        address oldOwner = owner;
        owner = newOwner;
        
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    /**
     * @dev Get goal details
     * @param goalId The goal ID to query
     * @return user The user who committed the funds
     * @return amount The amount committed
     * @return deadline The deadline timestamp
     * @return completed Whether the goal is completed
     * @return validatedByAI Whether validation was done by AI
     * @return recipient The recipient address for failed goals
     * @return claimed Whether funds have been claimed
     */
    function getGoal(bytes32 goalId) external view returns (
        address user,
        uint256 amount,
        uint256 deadline,
        bool completed,
        bool validatedByAI,
        address recipient,
        bool claimed
    ) {
        require(goalExists[goalId], "LazChain: goal does not exist");
        Goal storage goal = goals[goalId];
        
        return (
            goal.user,
            goal.amount,
            goal.deadline,
            goal.completed,
            goal.validatedByAI,
            goal.recipient,
            goal.claimed
        );
    }
    
    /**
     * @dev Check if a goal can be claimed
     * @param goalId The goal ID to check
     * @return claimable Whether the goal can be claimed
     * @return reason Reason why it can or cannot be claimed
     */
    function canClaim(bytes32 goalId) external view returns (bool claimable, string memory reason) {
        if (!goalExists[goalId]) {
            return (false, "Goal does not exist");
        }
        
        Goal storage goal = goals[goalId];
        
        if (goal.claimed) {
            return (false, "Funds already claimed");
        }
        
        if (block.timestamp <= goal.deadline) {
            return (false, "Deadline has not passed");
        }
        
        return (true, "Goal can be claimed");
    }
    
    /**
     * @dev Get contract balance
     * @return balance Current contract balance in native Metis
     */
    function getBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency function to recover stuck funds (only owner)
     * This should only be used in extreme circumstances
     * @param to Address to send funds to
     * @param amount Amount to recover
     */
    function emergencyRecover(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "LazChain: invalid recipient");
        require(amount <= address(this).balance, "LazChain: insufficient balance");
        
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "LazChain: emergency recovery failed");
    }
} 