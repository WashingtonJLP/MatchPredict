-- Nullable reference only; existing users and avatar URLs remain unchanged.
ALTER TABLE "users" ADD COLUMN "avatar_key" TEXT;
