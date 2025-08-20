import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const address = "0x0715cdCC40d2031e4619791CA855376723e59F83";
  
  // Connect to Metis testnet
  const provider = new ethers.JsonRpcProvider("https://sepolia.metisdevops.link");
  
  try {
    const balance = await provider.getBalance(address);
    console.log("Wallet Address:", address);
    console.log("Balance:", ethers.formatEther(balance), "METIS");
    
    if (balance === 0n) {
      console.log("\n❌ No tokens found!");
      console.log("Please get testnet tokens from: https://sepolia.metisdevops.link/faucet");
    } else {
      console.log("\n✅ You have tokens! Ready to deploy.");
    }
  } catch (error) {
    console.error("Error checking balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 