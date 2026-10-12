BEGIN;

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- A nullable timestamp preserves every existing account as active while making
-- administrative deactivation reversible and immediately enforceable.
ALTER TABLE "users"
ADD COLUMN "disabled_at" TIMESTAMP(3),
ADD COLUMN "auth_version" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "users_disabled_at_idx" ON "users"("disabled_at");
CREATE INDEX "users_role_created_at_idx" ON "users"("role", "created_at");
CREATE INDEX "users_disabled_at_created_at_idx"
ON "users"("disabled_at", "created_at");

CREATE INDEX "users_name_trgm_idx"
ON "users" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "users_email_trgm_idx"
ON "users" USING GIN ("email" gin_trgm_ops);

CREATE INDEX "payments_status_created_at_idx"
ON "payments"("status", "created_at");

CREATE INDEX "participations_status_created_at_idx"
ON "participations"("status", "created_at");

CREATE TYPE "AdminAuditAction" AS ENUM (
    'USER_DELETED',
    'USER_DISABLED',
    'USER_REACTIVATED'
);

CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "action" "AdminAuditAction" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_admin_user_id_created_at_idx"
ON "admin_audit_logs"("admin_user_id", "created_at");

CREATE INDEX "admin_audit_logs_target_type_target_id_idx"
ON "admin_audit_logs"("target_type", "target_id");

CREATE INDEX "admin_audit_logs_action_created_at_idx"
ON "admin_audit_logs"("action", "created_at");

ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_fkey"
FOREIGN KEY ("admin_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
