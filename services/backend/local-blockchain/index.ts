import { readFileSync } from 'fs';
import { join } from 'path';

export const LazChainArtifact = JSON.parse(
  readFileSync(join(process.cwd(), 'services/backend/artifacts/contracts/LazChain.sol/LazChain.json'), 'utf-8')
);
