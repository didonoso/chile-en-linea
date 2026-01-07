-- AlterTable
ALTER TABLE "User" ALTER COLUMN "userGroupId" SET DEFAULT 2;

-- CreateTable
CREATE TABLE "Reputation" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,

    CONSTRAINT "Reputation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reputation_toUserId_idx" ON "Reputation"("toUserId");

-- CreateIndex
CREATE INDEX "Reputation_fromUserId_idx" ON "Reputation"("fromUserId");

-- CreateIndex
CREATE INDEX "Reputation_createdAt_idx" ON "Reputation"("createdAt");

-- AddForeignKey
ALTER TABLE "Reputation" ADD CONSTRAINT "Reputation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reputation" ADD CONSTRAINT "Reputation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
