/*
  Warnings:

  - Added the required column `userId` to the `shopify_webhook_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shopify_webhook_logs" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "shopify_webhook_logs" ADD CONSTRAINT "shopify_webhook_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
