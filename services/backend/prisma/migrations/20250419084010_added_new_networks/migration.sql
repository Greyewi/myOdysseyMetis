-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WalletNetwork" ADD VALUE 'ARBITRUM';
ALTER TYPE "WalletNetwork" ADD VALUE 'OPTIMISM';
ALTER TYPE "WalletNetwork" ADD VALUE 'POLYGON';
ALTER TYPE "WalletNetwork" ADD VALUE 'BSC';
ALTER TYPE "WalletNetwork" ADD VALUE 'SOLANA';
ALTER TYPE "WalletNetwork" ADD VALUE 'BITCOIN';
