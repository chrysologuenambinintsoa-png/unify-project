-- CreatePageLikes
CREATE TABLE "page_likes" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_likes_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "page_likes_pageId_userId_key" ON "page_likes"("pageId", "userId");
CREATE INDEX "page_likes_pageId_idx" ON "page_likes"("pageId");
CREATE INDEX "page_likes_userId_idx" ON "page_likes"("userId");

-- Foreign keys (if referenced tables exist)
ALTER TABLE IF EXISTS "page_likes"
  ADD CONSTRAINT "page_likes_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "page_likes"
  ADD CONSTRAINT "page_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
