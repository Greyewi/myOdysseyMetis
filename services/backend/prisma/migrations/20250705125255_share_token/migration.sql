/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Goal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Goal_shareToken_key" ON "Goal"("shareToken");
