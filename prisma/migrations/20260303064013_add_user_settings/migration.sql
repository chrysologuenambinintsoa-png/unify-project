/*
  Warnings:

  - You are about to drop the column `amisList` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shares" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "visibility" TEXT DEFAULT 'public';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "amisList",
ADD COLUMN     "settings" JSONB;

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverIcon" TEXT,
    "cover" TEXT,
    "members" INTEGER NOT NULL DEFAULT 0,
    "membersList" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);
