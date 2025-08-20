# LazChain Deployment Guide

## Prerequisites

1. **Node.js and npm** installed
2. **Hardhat** configured (already done)
3. **Metis testnet tokens** for gas fees
4. **Private key** from your wallet

## Step 1: Get Testnet Tokens

Visit the Metis testnet faucet to get testnet tokens:
- **Faucet URL**: https://sepolia.metisdevops.link/faucet
- **Network**: Metis Sepolia Testnet
- **Chain ID**: 59902

## Step 2: Set Up Environment Variables

### Option A: Export in Terminal (Temporary)
```bash
export PRIVATE_KEY=your_private_key_here
```

### Option B: Create .env File (Recommended)
```bash
# Create .env file
echo "PRIVATE_KEY=your_private_key_here" > .env

# Add .env to .gitignore (if not already there)
echo ".env" >> .gitignore
```

## Step 3: Deploy to Metis Testnet

### Using the Deployment Script (Recommended)
```bash
./scripts/deploy-metis-testnet.sh
```

### Manual Deployment
```bash
npx hardhat run scripts/deploy-lazchain.js --network metis_testnet
```

## Step 4: Verify the Contract

After deployment, you'll get a contract address. Verify it on the Metis testnet explorer:

```bash
npx hardhat verify --network metis_testnet CONTRACT_ADDRESS
```

## Step 5: Test the Contract

1. **Commit a Goal**:
   ```javascript
   const goalId = ethers.keccak256(ethers.toUtf8Bytes("test-goal"));
   const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
   const recipient = "0x742d35Cc6634C0532925a3b8D52C8b4a4C2D1D9A";
   
   await lazChain.commitGoal(goalId, deadline, recipient, {
     value: ethers.parseEther("0.1") // 0.1 Metis
   });
   ```

2. **Mark as Completed** (Owner only):
   ```javascript
   await lazChain.markCompleted(goalId, true);
   ```

3. **Claim Funds** (After deadline):
   ```javascript
   await lazChain.claim(goalId);
   ```

## Network Configuration

The contract is configured for these networks:

| Network | URL | Chain ID | Purpose |
|---------|-----|----------|---------|
| Hardhat | Local | 1337 | Development |
| Metis Testnet | https://sepolia.metisdevops.link | 59902 | Testing |
| Metis Mainnet | https://andromeda.metis.io | 1088 | Production |

## Troubleshooting

### Common Issues

1. **"PRIVATE_KEY not set"**
   - Make sure you've exported your private key
   - Check that the .env file exists and is readable

2. **"Insufficient funds"**
   - Get more testnet tokens from the faucet
   - Check your wallet balance

3. **"Network not found"**
   - Verify hardhat.config.js has the correct network configuration
   - Check the RPC URL is accessible

4. **"Contract verification failed"**
   - Make sure the contract address is correct
   - Check that the network matches the deployment network

### Gas Estimation

Typical gas costs:
- **Deployment**: ~1,027,218 gas
- **commitGoal**: ~136,410 gas
- **markCompleted**: ~35,373 gas
- **claim**: ~48,854 gas

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit your private key** to version control
2. **Use a dedicated wallet** for testing, not your main wallet
3. **Keep your private key secure** and don't share it
4. **Test thoroughly** on testnet before mainnet deployment

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the test logs: `npx hardhat test`
3. Check the contract documentation in README.md
4. Create an issue in the repository 