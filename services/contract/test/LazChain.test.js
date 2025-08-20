import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("LazChain", function () {
  let lazChain;
  let owner, user1, user2, recipient;
  let goalId;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, recipient] = await ethers.getSigners();

    // Deploy LazChain contract
    const LazChain = await ethers.getContractFactory("LazChain");
    lazChain = await LazChain.deploy();
    await lazChain.waitForDeployment();

    // Create a unique goal ID for testing using timestamp and random number
    goalId = ethers.keccak256(ethers.toUtf8Bytes(`test-goal-${Date.now()}-${Math.random()}`));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lazChain.owner()).to.equal(owner.address);
    });

    it("Should have zero balance initially", async function () {
      expect(await lazChain.getBalance()).to.equal(0);
    });
  });

  describe("Goal Commitment", function () {
    it("Should allow users to commit funds to a goal", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const amount = ethers.parseEther("1.0");

      await expect(
        lazChain.connect(user1).commitGoal(goalId, deadline, recipient.address, {
          value: amount
        })
      )
        .to.emit(lazChain, "GoalCommitted")
        .withArgs(goalId, user1.address, amount, deadline, recipient.address);

      // Verify goal was created
      const goal = await lazChain.getGoal(goalId);
      expect(goal.user).to.equal(user1.address);
      expect(goal.amount).to.equal(amount);
      expect(goal.deadline).to.equal(deadline);
      expect(goal.completed).to.be.false;
      expect(goal.validatedByAI).to.be.false;
      expect(goal.recipient).to.equal(recipient.address);
      expect(goal.claimed).to.be.false;
    });

    it("Should reject commitment with zero value", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        lazChain.connect(user1).commitGoal(goalId, deadline, recipient.address, {
          value: 0
        })
      ).to.be.revertedWith("LazChain: must send native Metis");
    });

    it("Should reject commitment with past deadline", async function () {
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const amount = ethers.parseEther("1.0");

      await expect(
        lazChain.connect(user1).commitGoal(goalId, pastDeadline, recipient.address, {
          value: amount
        })
      ).to.be.revertedWith("LazChain: deadline must be in the future");
    });

    it("Should reject commitment with zero recipient address", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const amount = ethers.parseEther("1.0");

      await expect(
        lazChain.connect(user1).commitGoal(goalId, deadline, ethers.ZeroAddress, {
          value: amount
        })
      ).to.be.revertedWith("LazChain: recipient cannot be zero address");
    });

    it("Should reject duplicate goal IDs", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const amount = ethers.parseEther("1.0");

      // First commitment should succeed
      await lazChain.connect(user1).commitGoal(goalId, deadline, recipient.address, {
        value: amount
      });

      // Second commitment with same goal ID should fail
      await expect(
        lazChain.connect(user2).commitGoal(goalId, deadline, recipient.address, {
          value: amount
        })
      ).to.be.revertedWith("LazChain: goal ID already exists");
    });
  });

  describe("Goal Completion", function () {
    beforeEach(async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const deadline = currentBlock.timestamp + 7200;
      const amount = ethers.parseEther("1.0");

      await lazChain.connect(user1).commitGoal(goalId, deadline, recipient.address, {
        value: amount
      });
    });

    it("Should allow owner to mark goal as completed", async function () {
      await expect(lazChain.connect(owner).markCompleted(goalId, true))
        .to.emit(lazChain, "GoalCompleted")
        .withArgs(goalId, true);

      const goal = await lazChain.getGoal(goalId);
      expect(goal.completed).to.be.true;
      expect(goal.validatedByAI).to.be.true;
    });

    it("Should allow owner to mark goal as completed without AI validation", async function () {
      await expect(lazChain.connect(owner).markCompleted(goalId, false))
        .to.emit(lazChain, "GoalCompleted")
        .withArgs(goalId, false);

      const goal = await lazChain.getGoal(goalId);
      expect(goal.completed).to.be.true;
      expect(goal.validatedByAI).to.be.false;
    });

    it("Should reject non-owner attempts to mark completion", async function () {
      await expect(
        lazChain.connect(user1).markCompleted(goalId, true)
      ).to.be.revertedWith("LazChain: caller is not the owner");
    });

    it("Should reject completion of non-existent goal", async function () {
      const nonExistentGoalId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      
      await expect(
        lazChain.connect(owner).markCompleted(nonExistentGoalId, true)
      ).to.be.revertedWith("LazChain: goal does not exist");
    });

    it("Should reject completion of already completed goal", async function () {
      await lazChain.connect(owner).markCompleted(goalId, true);

      await expect(
        lazChain.connect(owner).markCompleted(goalId, true)
      ).to.be.revertedWith("LazChain: goal already completed");
    });
  });

  describe("Goal Claiming", function () {
    let futureDeadline;
    
    beforeEach(async function () {
      // Get current block timestamp and add 2 hours
      const currentBlock = await ethers.provider.getBlock('latest');
      futureDeadline = currentBlock.timestamp + 7200; // 2 hours from current block
      const amount = ethers.parseEther("1.0");

      await lazChain.connect(user1).commitGoal(goalId, futureDeadline, recipient.address, {
        value: amount
      });
    });

    it("Should return funds to user when goal is completed", async function () {
      // Mark goal as completed
      await lazChain.connect(owner).markCompleted(goalId, true);

      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [7300]); // 2 hours + 100 seconds
      await ethers.provider.send("evm_mine", []);

      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await expect(lazChain.connect(user2).claim(goalId))
        .to.emit(lazChain, "GoalClaimed")
        .withArgs(goalId, user1.address, ethers.parseEther("1.0"), true);

      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.0"));

      const goal = await lazChain.getGoal(goalId);
      expect(goal.claimed).to.be.true;
    });

    it("Should send funds to recipient when goal is not completed", async function () {
      // Don't mark goal as completed, just wait for deadline

      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [7300]); // 2 hours + 100 seconds
      await ethers.provider.send("evm_mine", []);

      const initialBalance = await ethers.provider.getBalance(recipient.address);
      
      await expect(lazChain.connect(user2).claim(goalId))
        .to.emit(lazChain, "GoalClaimed")
        .withArgs(goalId, recipient.address, ethers.parseEther("1.0"), false);

      const finalBalance = await ethers.provider.getBalance(recipient.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.0"));

      const goal = await lazChain.getGoal(goalId);
      expect(goal.claimed).to.be.true;
    });

    it("Should reject claiming before deadline", async function () {
      await expect(
        lazChain.connect(user2).claim(goalId)
      ).to.be.revertedWith("LazChain: deadline has not passed");
    });

    it("Should reject claiming already claimed goal", async function () {
      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [7300]);
      await ethers.provider.send("evm_mine", []);

      // First claim should succeed
      await lazChain.connect(user2).claim(goalId);

      // Second claim should fail
      await expect(
        lazChain.connect(user2).claim(goalId)
      ).to.be.revertedWith("LazChain: funds already claimed");
    });

    it("Should reject claiming non-existent goal", async function () {
      const nonExistentGoalId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      
      await expect(
        lazChain.connect(user2).claim(nonExistentGoalId)
      ).to.be.revertedWith("LazChain: goal does not exist");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const deadline = currentBlock.timestamp + 7200;
      const amount = ethers.parseEther("1.0");

      await lazChain.connect(user1).commitGoal(goalId, deadline, recipient.address, {
        value: amount
      });
    });

    it("Should return correct goal details", async function () {
      const goal = await lazChain.getGoal(goalId);
      
      expect(goal.user).to.equal(user1.address);
      expect(goal.amount).to.equal(ethers.parseEther("1.0"));
      expect(goal.completed).to.be.false;
      expect(goal.validatedByAI).to.be.false;
      expect(goal.recipient).to.equal(recipient.address);
      expect(goal.claimed).to.be.false;
    });

    it("Should return correct claim status", async function () {
      // Before deadline
      let [canClaim, reason] = await lazChain.canClaim(goalId);
      expect(canClaim).to.be.false;
      expect(reason).to.equal("Deadline has not passed");

      // After deadline
      await ethers.provider.send("evm_increaseTime", [7300]);
      await ethers.provider.send("evm_mine", []);

      [canClaim, reason] = await lazChain.canClaim(goalId);
      expect(canClaim).to.be.true;
      expect(reason).to.equal("Goal can be claimed");
    });

    it("Should return correct contract balance", async function () {
      const balance = await lazChain.getBalance();
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      await expect(lazChain.connect(owner).transferOwnership(user1.address))
        .to.emit(lazChain, "OwnershipTransferred")
        .withArgs(owner.address, user1.address);

      expect(await lazChain.owner()).to.equal(user1.address);
    });

    it("Should reject ownership transfer to zero address", async function () {
      await expect(
        lazChain.connect(owner).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("LazChain: new owner is the zero address");
    });

    it("Should reject ownership transfer by non-owner", async function () {
      await expect(
        lazChain.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWith("LazChain: caller is not the owner");
    });
  });

  describe("Emergency Recovery", function () {
    beforeEach(async function () {
      const currentBlock = await ethers.provider.getBlock('latest');
      const deadline = currentBlock.timestamp + 7200;
      const amount = ethers.parseEther("1.0");

      await lazChain.connect(user1).commitGoal(goalId, deadline, recipient.address, {
        value: amount
      });
    });

    it("Should allow owner to recover funds in emergency", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const recoveryAmount = ethers.parseEther("0.5");

      const tx = await lazChain.connect(owner).emergencyRecover(owner.address, recoveryAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance - initialBalance + gasUsed).to.equal(recoveryAmount);
    });

    it("Should reject emergency recovery by non-owner", async function () {
      await expect(
        lazChain.connect(user1).emergencyRecover(user1.address, ethers.parseEther("0.5"))
      ).to.be.revertedWith("LazChain: caller is not the owner");
    });

    it("Should reject recovery to zero address", async function () {
      await expect(
        lazChain.connect(owner).emergencyRecover(ethers.ZeroAddress, ethers.parseEther("0.5"))
      ).to.be.revertedWith("LazChain: invalid recipient");
    });

    it("Should reject recovery of more than contract balance", async function () {
      await expect(
        lazChain.connect(owner).emergencyRecover(owner.address, ethers.parseEther("2.0"))
      ).to.be.revertedWith("LazChain: insufficient balance");
    });
  });
}); 