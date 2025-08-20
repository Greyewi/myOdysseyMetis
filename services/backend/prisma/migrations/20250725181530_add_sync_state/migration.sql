-- CreateTable
CREATE TABLE "SyncState" (
    "id" SERIAL NOT NULL,
    "blockId" INTEGER NOT NULL DEFAULT 0,
    "contractId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_contractId_key" ON "SyncState"("contractId");
