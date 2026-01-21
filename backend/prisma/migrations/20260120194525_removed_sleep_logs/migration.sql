/*
  Warnings:

  - You are about to drop the column `currentSleepLogId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isSleeping` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `DailyHealthLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SleepLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DailyHealthLog" DROP CONSTRAINT "DailyHealthLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "SleepLog" DROP CONSTRAINT "SleepLog_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currentSleepLogId",
DROP COLUMN "isSleeping";

-- DropTable
DROP TABLE "DailyHealthLog";

-- DropTable
DROP TABLE "SleepLog";
