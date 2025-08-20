# LazChain Smart Contract

A Solidity smart contract for goal commitment and accountability on the Metis blockchain.

## Deployed Contract

**Contract Address:** `0x44328E50C039cE9EB0E075f68AEB9DBa60a894c8`  
**Network:** Metis Sepolia Testnet  
**Explorer:** [View on Explorer](https://sepolia-explorer.metisdevops.link/address/0x44328E50C039cE9EB0E075f68AEB9DBa60a894c8)  
**Owner:** `0x0715cdCC40d2031e4619791CA855376723e59F83`

## How It Works

### Goal Commitment
Users commit native Metis tokens to personal goals by calling `commitGoal()` with:
- Unique goal ID
- Deadline timestamp
- Recipient address (gets funds if goal fails)

### Goal Completion
Only the contract owner can mark goals as completed using `markCompleted()` with optional AI validation flag.

### Fund Distribution
After the deadline, anyone can call `claim()`:
- **If completed**: Funds return to the user
- **If not completed**: Funds go to the recipient

## Main Functions

- `commitGoal(goalId, deadline, recipient)` - Commit funds to a goal
- `markCompleted(goalId, byAI)` - Mark goal as completed (owner only)
- `claim(goalId)` - Claim funds after deadline
- `getGoal(goalId)` - View goal details
- `canClaim(goalId)` - Check if goal can be claimed

## Security Features

- Reentrancy protection
- Access control (only owner can mark completion)
- Input validation
- Unique goal ID enforcement
- Safe fund transfers

## Testing

```bash
npx hardhat test test/LazChain.test.js
```

## Deployment

```bash
npx hardhat run scripts/deploy-lazchain.js --network metis_testnet
```

## License

MIT License
