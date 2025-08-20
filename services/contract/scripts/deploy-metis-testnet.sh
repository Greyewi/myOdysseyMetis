#!/bin/bash

# LazChain Deployment Script for Metis Testnet
echo "🚀 LazChain Deployment Script for Metis Testnet"
echo "================================================"

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    echo ""
    echo "To deploy to Metis testnet, you need to:"
    echo "1. Set your private key as an environment variable:"
    echo "   export PRIVATE_KEY=your_private_key_here"
    echo ""
    echo "2. Make sure you have testnet Metis tokens in your wallet"
    echo "   Get testnet tokens from: https://sepolia.metisdevops.link/faucet"
    echo ""
    echo "3. Run this script again"
    exit 1
fi

echo "✅ PRIVATE_KEY is set"
echo "🌐 Deploying to Metis Testnet..."
echo ""

# Deploy the contract
npx hardhat run scripts/deploy-lazchain.js --network metis_testnet

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Save the contract address from above"
echo "2. Verify the contract on Metis testnet explorer"
echo "3. Test the contract functionality" 