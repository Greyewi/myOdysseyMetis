-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "lastBalance" TEXT,
ADD COLUMN     "lastBalanceUpdate" TIMESTAMP(3);
