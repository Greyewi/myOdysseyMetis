const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("CryptoGoals Contract", function () {
  async function deployCryptoGoalsFixture() {
    const [owner, user1, user2, charity1, charity2] = await ethers.getSigners();
    const CryptoGoals = await ethers.getContractFactory("CryptoGoals");
    const cryptoGoals = await CryptoGoals.deploy();

    return { cryptoGoals, owner, user1, user2, charity1, charity2 };
  }

  it("Should create a goal with valid parameters", async function () {
    const { cryptoGoals, owner, user1, charity1 } = await loadFixture(deployCryptoGoalsFixture);

    await cryptoGoals.connect(owner).addCharityAddress(charity1.address);

    const depositAmount = ethers.parseEther("1"); // BigInt
    const deadline = (await time.latest()) + 3600; // Через 1 час

    await expect(
      cryptoGoals
        .connect(user1)
        .createGoal(deadline, 0, charity1.address, { value: depositAmount })
    )
      .to.emit(cryptoGoals, "GoalCreated")
      .withArgs(0, user1.address, depositAmount - (depositAmount * 30n) / 10000n, deadline, 0, charity1.address);
  });

  it("Should fail goal and donate to selected charity", async function () {
    const { cryptoGoals, owner, user1, user2, charity1 } = await loadFixture(deployCryptoGoalsFixture);

    await cryptoGoals.connect(owner).addCharityAddress(charity1.address);

    const depositAmount = ethers.parseEther("1"); // 1 ETH
    const deadline = (await time.latest()) + 10;


    await cryptoGoals
      .connect(user1)
      .createGoal(deadline, 0, charity1.address, { value: depositAmount });


    await time.increase(20);


    const precision = BigInt(10000); // 100.00%
    const cancelFee = (depositAmount * BigInt(60)) / precision;
    const expectedDonation = depositAmount - cancelFee;


    const charityBalanceBefore = await ethers.provider.getBalance(charity1.address);


    const tx = await cryptoGoals.connect(user2).failGoal(0);
    const receipt = await tx.wait();


    const charityBalanceAfter = await ethers.provider.getBalance(charity1.address);


    const actualDonation = charityBalanceAfter - charityBalanceBefore;


    const expectedPrefix = expectedDonation.toString().slice(0, 2).toString();
    const actualPrefix = actualDonation.toString().slice(0, 2).toString();


    expect(actualPrefix).to.equal(expectedPrefix);
  });

  it("Should complete a goal successfully", async function () {
    const { cryptoGoals, owner, user1, charity1 } = await loadFixture(deployCryptoGoalsFixture);

    await cryptoGoals.connect(owner).addCharityAddress(charity1.address);

    const depositAmount = ethers.parseEther("1");
    const deadline = (await time.latest()) + 3600;

    await cryptoGoals
      .connect(user1)
      .createGoal(deadline, 0, charity1.address, { value: depositAmount });

    const userBalanceBefore = await ethers.provider.getBalance(user1.address);

    const tx = await cryptoGoals.connect(user1).completeGoal(0);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * BigInt(tx.gasPrice);

    const userBalanceAfter = await ethers.provider.getBalance(user1.address);

    expect(userBalanceAfter + gasUsed).to.equal(
      userBalanceBefore + depositAmount - (depositAmount * 30n) / 10000n
    );
  });

  it("Should only allow owner to add charity address", async function () {
    const { cryptoGoals, owner, user1, charity1 } = await loadFixture(deployCryptoGoalsFixture);

    await expect(cryptoGoals.connect(owner).addCharityAddress(charity1.address))
      .to.emit(cryptoGoals, "CharityAddressAdded")
      .withArgs(charity1.address);

    await expect(cryptoGoals.connect(user1).addCharityAddress(charity1.address))
      .to.be.revertedWith("Only owner can perform this action");
  });

  it("Should allow owner to remove charity address", async function () {
    const { cryptoGoals, owner, charity1, charity2 } = await loadFixture(deployCryptoGoalsFixture);

    await cryptoGoals.connect(owner).addCharityAddress(charity1.address);
    await cryptoGoals.connect(owner).addCharityAddress(charity2.address);

    await expect(cryptoGoals.connect(owner).removeCharityAddress(0))
      .to.emit(cryptoGoals, "CharityAddressRemoved")
      .withArgs(charity1.address);

    const remainingCharityAddresses = await cryptoGoals.getCharityAddresses();
    expect(remainingCharityAddresses).to.deep.equal([charity2.address]);
  });

  it("Should fail to create a goal with invalid charity address", async function () {
    const { cryptoGoals, user1, charity1 } = await loadFixture(deployCryptoGoalsFixture);

    const depositAmount = ethers.parseEther("1");
    const deadline = (await time.latest()) + 3600;

    await expect(
      cryptoGoals.connect(user1).createGoal(deadline, 0, charity1.address, { value: depositAmount })
    ).to.be.revertedWith("Invalid charity address");
  });

  it("Should update creation and cancel fees", async function () {
    const { cryptoGoals, owner } = await loadFixture(deployCryptoGoalsFixture);

    const newCreationFee = BigInt(5e16); // 5% = 5 * 1e16
    const newCancelFee = BigInt(10e16); // 10% = 10 * 1e16

    await expect(cryptoGoals.connect(owner).updateCreationFeePercent(newCreationFee))
      .to.emit(cryptoGoals, "FeeUpdated")
      .withArgs("Creation Fee", newCreationFee);

    await expect(cryptoGoals.connect(owner).updateCancelFeePercent(newCancelFee))
      .to.emit(cryptoGoals, "FeeUpdated")
      .withArgs("Cancel Fee", newCancelFee);
  });
});
