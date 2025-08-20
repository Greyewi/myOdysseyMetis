import pkg from "hardhat";
const { ethers, network } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy LazChain
  const LazChain = await ethers.getContractFactory("LazChain");
  console.log("Deploying LazChain...");
  
  const lazChain = await LazChain.deploy();
  await lazChain.waitForDeployment();
  
  const address = await lazChain.getAddress();
  console.log("LazChain deployed to:", address);
  console.log("Contract owner:", await lazChain.owner());
  
  // Verify the contract is working
  console.log("Contract balance:", ethers.formatEther(await lazChain.getBalance()));
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: address,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString()
  };
  
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Network:", deploymentInfo.network);
  console.log("Contract Address:", deploymentInfo.contractAddress);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Block Number:", deploymentInfo.blockNumber);
  console.log("Timestamp:", deploymentInfo.timestamp);
  
  // Instructions for verification (if on testnet/mainnet)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nTo verify the contract, run:");
    console.log(`npx hardhat verify --network ${network.name} ${address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 