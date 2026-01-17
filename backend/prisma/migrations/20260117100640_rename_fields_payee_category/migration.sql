/*
  Warnings:

  - You are about to drop the column `name` on the `PendingTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `payee` to the `PendingTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payee` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PendingTransaction" DROP COLUMN "name",
ADD COLUMN     "payee" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "subtitle",
DROP COLUMN "title",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "payee" TEXT NOT NULL;
