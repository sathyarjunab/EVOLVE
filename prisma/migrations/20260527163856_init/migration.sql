-- DropForeignKey
ALTER TABLE "shopify_webhook_logs" DROP CONSTRAINT "shopify_webhook_logs_userId_fkey";

-- AlterTable
ALTER TABLE "shopify_webhook_logs" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "shopify_webhook_logs" ADD CONSTRAINT "shopify_webhook_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
