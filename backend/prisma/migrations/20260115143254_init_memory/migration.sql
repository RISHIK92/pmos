/*
  Warnings:

  - You are about to drop the `Query` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Query" DROP CONSTRAINT "Query_userId_fkey";

-- DropTable
DROP TABLE "Query";

-- CreateTable
CREATE TABLE "ConversationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userRaw" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "enricherData" JSONB,
    "targetCategory" TEXT,

    CONSTRAINT "ConversationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fact" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "certainty" DOUBLE PRECISION NOT NULL,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CoreMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationLog_userId_targetCategory_idx" ON "ConversationLog"("userId", "targetCategory");

-- CreateIndex
CREATE INDEX "ConversationLog_createdAt_idx" ON "ConversationLog"("createdAt");

-- CreateIndex
CREATE INDEX "CoreMemory_userId_category_idx" ON "CoreMemory"("userId", "category");

-- AddForeignKey
ALTER TABLE "ConversationLog" ADD CONSTRAINT "ConversationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreMemory" ADD CONSTRAINT "CoreMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
