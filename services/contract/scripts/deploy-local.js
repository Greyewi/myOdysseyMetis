import pkg from "hardhat";
const { ethers, network } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying LazChain to Local Network");
  console.log("======================================");
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy LazChain
  const LazChain = await ethers.getContractFactory("LazChain");
  console.log("\n📦 Deploying LazChain...");
  
  const lazChain = await LazChain.deploy();
  await lazChain.waitForDeployment();
  
  const address = await lazChain.getAddress();
  console.log("✅ LazChain deployed to:", address);
  console.log("👑 Contract owner:", await lazChain.owner());
  
  // Test the contract functionality
  console.log("\n🧪 Testing Contract Functionality...");
  
  // Create a test goal
  const testGoalId = ethers.keccak256(ethers.toUtf8Bytes("test-fitness-goal"));
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const testRecipient = "0x742d35Cc6634C0532925a3b8D52C8b4a4C2D1D9A";
  const testAmount = ethers.parseEther("1.0");
  
  console.log("📝 Creating test goal...");
  await lazChain.connect(deployer).commitGoal(testGoalId, deadline, testRecipient, {
    value: testAmount
  });
  console.log("✅ Test goal created!");
  
  // Mark goal as completed
  console.log("✅ Marking goal as completed...");
  await lazChain.connect(deployer).markCompleted(testGoalId, true);
  console.log("✅ Goal marked as completed by AI!");
  
  // Get goal details
  const goal = await lazChain.getGoal(testGoalId);
  console.log("\n📊 Goal Details:");
  console.log("- User:", goal.user);
  console.log("- Amount:", ethers.formatEther(goal.amount), "ETH");
  console.log("- Completed:", goal.completed);
  console.log("- Validated by AI:", goal.validatedByAI);
  console.log("- Recipient:", goal.recipient);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: address,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    testGoalId: testGoalId
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("=====================");
  console.log("Network:", deploymentInfo.network);
  console.log("Contract Address:", deploymentInfo.contractAddress);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Block Number:", deploymentInfo.blockNumber);
  console.log("Timestamp:", deploymentInfo.timestamp);
  console.log("Test Goal ID:", deploymentInfo.testGoalId);
  
  console.log("\n🎉 Contract is working perfectly!");
  console.log("\n💡 To deploy to Metis testnet:");
  console.log("1. Get testnet tokens from: https://sepolia.metisdevops.link/faucet");
  console.log("2. Run: npx hardhat run scripts/deploy-lazchain.js --network metis_testnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 