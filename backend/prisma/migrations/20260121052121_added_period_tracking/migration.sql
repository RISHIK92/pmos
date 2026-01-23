-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" TEXT;

-- CreateTable
CREATE TABLE "PeriodCycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodCycle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeriodCycle_userId_startDate_idx" ON "PeriodCycle"("userId", "startDate");

-- AddForeignKey
ALTER TABLE "PeriodCycle" ADD CONSTRAINT "PeriodCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
