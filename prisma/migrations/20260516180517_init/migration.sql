/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('morning', 'afternoon', 'evening', 'anytime');

-- CreateEnum
CREATE TYPE "TrackerType" AS ENUM ('habit_tracker', 'money_tracker');

-- CreateEnum
CREATE TYPE "accessType" AS ENUM ('habit_tracker', 'money_tracker');

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "timezone" VARCHAR(60) NOT NULL DEFAULT 'UTC',
    "access" JSONB NOT NULL DEFAULT '{"habit_tracker":false,"money_tracker":false}',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "icon" VARCHAR(8) NOT NULL,
    "time_of_day" "TimeOfDay" NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "log_date" DATE NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_summaries" (
    "user_id" TEXT NOT NULL,
    "summary_date" DATE NOT NULL,
    "total_habits" SMALLINT NOT NULL DEFAULT 0,
    "completed_count" SMALLINT NOT NULL DEFAULT 0,
    "completion_pct" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("user_id","summary_date")
);

-- CreateTable
CREATE TABLE "tracker_stats" (
    "user_id" TEXT NOT NULL,
    "tracker_type" "TrackerType" NOT NULL,
    "stats" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracker_stats_pkey" PRIMARY KEY ("user_id","tracker_type")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_habits_user_active" ON "habits"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_habits_user_order" ON "habits"("user_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_logs_user_date" ON "habit_logs"("user_id", "log_date" DESC);

-- CreateIndex
CREATE INDEX "idx_logs_habit_date" ON "habit_logs"("habit_id", "log_date" DESC);

-- CreateIndex
CREATE INDEX "idx_logs_covering" ON "habit_logs"("user_id", "log_date", "habit_id");

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_habit_id_log_date_key" ON "habit_logs"("habit_id", "log_date");

-- CreateIndex
CREATE INDEX "idx_daily_user_date" ON "daily_summaries"("user_id", "summary_date" DESC);

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracker_stats" ADD CONSTRAINT "tracker_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
