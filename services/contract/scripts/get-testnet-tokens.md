# Getting Metis Testnet Tokens

## Option 1: Official Metis Sepolia Faucet
- **URL**: https://sepolia.metisdevops.link/faucet
- **Steps**:
  1. Connect your wallet (MetaMask)
  2. Switch to Metis Sepolia Testnet
  3. Click "Request Tokens"
  4. Wait for confirmation

## Option 2: Alternative Faucets
- **Chainlink Faucet**: https://faucets.chain.link/sepolia
- **Alchemy Faucet**: https://sepoliafaucet.com/

## Option 3: Manual Network Setup in MetaMask

### Add Metis Sepolia Testnet:
1. Open MetaMask
2. Go to Settings → Networks → Add Network
3. Add these details:
   - **Network Name**: Metis Sepolia Testnet
   - **RPC URL**: https://sepolia.metisdevops.link
   - **Chain ID**: 59902
   - **Currency Symbol**: METIS
   - **Block Explorer**: https://sepolia.explorer.metisdevops.link

### Switch to Testnet:
1. In MetaMask, click the network dropdown
2. Select "Metis Sepolia Testnet"
3. Your address should show: 0x0715cdCC40d2031e4619791CA855376723e59F83

## Option 4: Use Local Development (No Tokens Needed)

If you can't get testnet tokens, you can test locally:

```bash
# Deploy to local network (no tokens needed)
npx hardhat run scripts/deploy-lazchain.js

# Run tests
npx hardhat test
```

## Check Your Balance

After getting tokens, check your balance:
```bash
npx hardhat run scripts/check-balance.js
```

## Deploy Contract

Once you have tokens:
```bash
npx hardhat run scripts/deploy-lazchain.js --network metis_testnet
```

## Troubleshooting

### "Insufficient funds" error:
- Make sure you have METIS tokens in your wallet
- Check that you're on the correct network
- Try a different faucet

### "Network not found" error:
- Make sure MetaMask is connected to Metis Sepolia Testnet
- Check the RPC URL is accessible

### "Private key not found" error:
- Make sure PRIVATE_KEY environment variable is set
- Check the private key format (should start with 0x) 