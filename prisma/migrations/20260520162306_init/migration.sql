-- CreateTable
CREATE TABLE "shopify_webhook_logs" (
    "id" TEXT NOT NULL,
    "topic" TEXT,
    "eventId" TEXT,
    "shopDomain" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopify_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopify_webhook_logs_topic_idx" ON "shopify_webhook_logs"("topic");

-- CreateIndex
CREATE INDEX "shopify_webhook_logs_createdAt_idx" ON "shopify_webhook_logs"("createdAt" DESC);
