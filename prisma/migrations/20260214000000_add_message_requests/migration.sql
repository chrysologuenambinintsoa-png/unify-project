-- AlterTable
ALTER TABLE "messages" ADD COLUMN "isMessageRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "messageRequestStatus" TEXT DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "messages_isMessageRequest_idx" ON "messages"("isMessageRequest");
