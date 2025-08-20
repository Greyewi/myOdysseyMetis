/*
  Warnings:

  - You are about to drop the column `walletId` on the `Goal` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_walletId_fkey";

-- DropIndex
DROP INDEX "Goal_walletId_key";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "walletId";

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "goalId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
