-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_network_fkey" FOREIGN KEY ("network") REFERENCES "TokenPrice"("network") ON DELETE RESTRICT ON UPDATE CASCADE;
