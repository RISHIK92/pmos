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
CREATE INDEX "CoreMemory_userId_category_idx" ON "CoreMemory"("userId", "category");

-- AddForeignKey
ALTER TABLE "CoreMemory" ADD CONSTRAINT "CoreMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
