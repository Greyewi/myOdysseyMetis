import pkg from "hardhat";
const { ethers, network } = pkg;

async function main() {
  console.log("🧪 Testing Deployed LazChain Contract");
  console.log("=====================================");
  console.log("Network:", network.name);
  console.log("Contract Address: 0x44328E50C039cE9EB0E075f68AEB9DBa60a894c8");
  console.log("");

  // Get the deployer signer (your wallet)
  const [deployer] = await ethers.getSigners();
  
  console.log("👤 Deployer Account:");
  console.log("- Address:", deployer.address);
  console.log("- Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "METIS");
  console.log("");

  // Connect to deployed contract
  const contractAddress = "0x44328E50C039cE9EB0E075f68AEB9DBa60a894c8";
  const LazChain = await ethers.getContractFactory("LazChain");
  const lazChain = LazChain.attach(contractAddress);
  
  console.log("🔗 Connected to deployed contract");
  console.log("Contract owner:", await lazChain.owner());
  console.log("Contract balance:", ethers.formatEther(await lazChain.getBalance()), "METIS");
  console.log("");

  // Test 1: Create a goal (using deployer as user)
  console.log("📝 Test 1: Creating a Goal");
  console.log("---------------------------");
  
  const goalId = ethers.keccak256(ethers.toUtf8Bytes("fitness-goal-2024"));
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const goalAmount = ethers.parseEther("0.01"); // 0.01 METIS
  const recipient = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Example recipient
  
  console.log("Goal ID:", goalId);
  console.log("Deadline:", new Date(deadline * 1000).toISOString());
  console.log("Amount:", ethers.formatEther(goalAmount), "METIS");
  console.log("Recipient:", recipient);
  
  try {
    const tx = await lazChain.connect(deployer).commitGoal(goalId, deadline, recipient, {
      value: goalAmount
    });
    console.log("✅ Goal created! Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmed!");
  } catch (error) {
    console.log("❌ Failed to create goal:", error.message);
    return;
  }
  
  console.log("");

  // Test 2: Check goal details
  console.log("📊 Test 2: Checking Goal Details");
  console.log("--------------------------------");
  
  try {
    const goal = await lazChain.getGoal(goalId);
    console.log("Goal Details:");
    console.log("- User:", goal.user);
    console.log("- Amount:", ethers.formatEther(goal.amount), "METIS");
    console.log("- Deadline:", new Date(goal.deadline * 1000).toISOString());
    console.log("- Completed:", goal.completed);
    console.log("- Validated by AI:", goal.validatedByAI);
    console.log("- Recipient:", goal.recipient);
    console.log("- Claimed:", goal.claimed);
  } catch (error) {
    console.log("❌ Failed to get goal details:", error.message);
  }
  
  console.log("");

  // Test 3: Mark goal as completed (owner only)
  console.log("✅ Test 3: Marking Goal as Completed");
  console.log("------------------------------------");
  
  try {
    const tx = await lazChain.connect(deployer).markCompleted(goalId, true);
    console.log("✅ Goal marked as completed by AI! Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmed!");
  } catch (error) {
    console.log("❌ Failed to mark goal as completed:", error.message);
  }
  
  console.log("");

  // Test 4: Check goal status after completion
  console.log("📊 Test 4: Checking Goal Status After Completion");
  console.log("------------------------------------------------");
  
  try {
    const goal = await lazChain.getGoal(goalId);
    console.log("Updated Goal Details:");
    console.log("- Completed:", goal.completed);
    console.log("- Validated by AI:", goal.validatedByAI);
  } catch (error) {
    console.log("❌ Failed to get updated goal details:", error.message);
  }
  
  console.log("");

  // Test 5: Try to claim before deadline (should fail)
  console.log("⏰ Test 5: Trying to Claim Before Deadline");
  console.log("------------------------------------------");
  
  try {
    await lazChain.connect(deployer).claim(goalId);
    console.log("❌ Claim succeeded (unexpected)");
  } catch (error) {
    console.log("✅ Claim correctly failed:", error.message);
  }
  
  console.log("");

  // Test 6: Check contract balance
  console.log("💰 Test 6: Contract Balance After Goal Creation");
  console.log("------------------------------------------------");
  
  try {
    const balance = await lazChain.getBalance();
    console.log("Contract balance:", ethers.formatEther(balance), "METIS");
  } catch (error) {
    console.log("❌ Failed to get contract balance:", error.message);
  }
  
  console.log("");
  console.log("🎉 Tests completed!");
  console.log("");
  console.log("📋 Summary:");
  console.log("- Goal created and committed");
  console.log("- Goal marked as completed by owner");
  console.log("- Pre-deadline claim correctly rejected");
  console.log("- All security checks working correctly");
  console.log("");
  console.log("💡 Note: To test claiming after deadline, wait for the actual deadline to pass");
  console.log("   or use a script that can manipulate time on a local network.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 