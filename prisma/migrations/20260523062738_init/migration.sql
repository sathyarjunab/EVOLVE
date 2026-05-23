-- CreateEnum
CREATE TYPE "BudgetTransactionType" AS ENUM ('income', 'expense', 'savings');

-- CreateTable
CREATE TABLE "budget_settings" (
    "user_id" TEXT NOT NULL,
    "currency" VARCHAR(5) NOT NULL DEFAULT '$',
    "tutorial_seen" BOOLEAN NOT NULL DEFAULT false,
    "bank_balance" DECIMAL(12,2),
    "bank_note" VARCHAR(200) NOT NULL DEFAULT '',
    "bank_bal_updated" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "income_sources" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "emoji" VARCHAR(8) NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'monthly',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "BudgetTransactionType" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "date" DATE NOT NULL,
    "note" VARCHAR(300),
    "goal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_dues" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_day" SMALLINT NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "emoji" VARCHAR(8) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_dues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "due_paid_logs" (
    "due_id" TEXT NOT NULL,
    "period_key" VARCHAR(7) NOT NULL,

    CONSTRAINT "due_paid_logs_pkey" PRIMARY KEY ("due_id","period_key")
);

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "current_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "emoji" VARCHAR(8) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_income_sources_user_active" ON "income_sources"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_budget_txs_user_date" ON "budget_transactions"("user_id", "date" DESC);

-- CreateIndex
CREATE INDEX "idx_budget_txs_user_type" ON "budget_transactions"("user_id", "type");

-- CreateIndex
CREATE INDEX "idx_fixed_dues_user_active" ON "fixed_dues"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_savings_goals_user_active" ON "savings_goals"("user_id", "is_active");

-- AddForeignKey
ALTER TABLE "budget_settings" ADD CONSTRAINT "budget_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "savings_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_dues" ADD CONSTRAINT "fixed_dues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "due_paid_logs" ADD CONSTRAINT "due_paid_logs_due_id_fkey" FOREIGN KEY ("due_id") REFERENCES "fixed_dues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
