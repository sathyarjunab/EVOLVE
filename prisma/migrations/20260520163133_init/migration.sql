/*
  Warnings:

  - You are about to drop the column `error` on the `shopify_webhook_logs` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `shopify_webhook_logs` table. All the data in the column will be lost.
  - You are about to drop the column `shopDomain` on the `shopify_webhook_logs` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `shopify_webhook_logs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "shopify_webhook_logs_topic_idx";

-- AlterTable
ALTER TABLE "shopify_webhook_logs" DROP COLUMN "error",
DROP COLUMN "eventId",
DROP COLUMN "shopDomain",
DROP COLUMN "topic";
