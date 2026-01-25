-- AlterTable
ALTER TABLE "User" ADD COLUMN     "slackId" TEXT,
ADD COLUMN     "slackTeamName" TEXT,
ADD COLUMN     "slackToken" TEXT;

-- CreateTable
CREATE TABLE "DailyJournal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERSONAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyJournal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyJournal_userId_idx" ON "DailyJournal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyJournal_userId_date_type_key" ON "DailyJournal"("userId", "date", "type");

-- AddForeignKey
ALTER TABLE "DailyJournal" ADD CONSTRAINT "DailyJournal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
