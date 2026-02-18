-- Add gender field to users table for dynamic avatar generation
-- Run this migration on your database to add gender support

ALTER TABLE "users" ADD COLUMN "gender" VARCHAR(10) DEFAULT 'other';

-- Create an index for faster queries
CREATE INDEX idx_users_gender ON "users"("gender");

-- OPTIONAL: Set gender based on existing patterns (if you have a naming convention)
-- UPDATE "users" SET "gender" = 'female' WHERE "username" LIKE '%woman%' OR "username" LIKE '%girl%' OR "username" LIKE '%fem%';
-- UPDATE "users" SET "gender" = 'male' WHERE "username" LIKE '%man%' OR "username" LIKE '%boy%' OR "username" LIKE '%male%';
