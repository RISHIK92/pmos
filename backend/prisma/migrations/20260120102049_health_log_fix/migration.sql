-- AlterTable
ALTER TABLE "Memory" ADD COLUMN     "isCritical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderDate" TEXT,
ADD COLUMN     "reminderTime" TEXT,
ADD COLUMN     "repeatPattern" TEXT;

-- CreateTable
CREATE TABLE "DailyHealthLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "hourlyData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyHealthLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyHealthLog_userId_idx" ON "DailyHealthLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyHealthLog_userId_date_key" ON "DailyHealthLog"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyHealthLog" ADD CONSTRAINT "DailyHealthLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
