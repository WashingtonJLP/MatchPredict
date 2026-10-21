-- Audit actions are a PostgreSQL enum: add the moderation event without changing existing data.
ALTER TYPE "AdminAuditAction" ADD VALUE 'USER_AVATAR_REMOVED';
