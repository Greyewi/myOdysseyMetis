-- CreateTable
CREATE TABLE "TokenPrice" (
    "id" SERIAL NOT NULL,
    "network" "WalletNetwork" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenPrice_network_key" ON "TokenPrice"("network");
