-- ============================================================
--  KB article approval
--
--  Articles written by employees / IT Support wait for a หัวหน้าทีม IT
--  (role 'admin') to approve them before anyone else can see them.
--
--  Safe to re-run. Articles that already exist become 'approved', so
--  nothing that was visible before this migration disappears.
--  01_schema.sql already includes these changes for fresh databases.
-- ============================================================

DO $$ BEGIN
	CREATE TYPE "kb_status_enum" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "kb_articles"
ADD COLUMN IF NOT EXISTS "status" kb_status_enum NOT NULL DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS "created_by" INTEGER,
ADD COLUMN IF NOT EXISTS "reviewed_by" INTEGER,
ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMPTZ;

-- New articles default to pending; the API publishes an admin's own article directly.
ALTER TABLE "kb_articles" ALTER COLUMN "status" SET DEFAULT 'pending';

DO $$ BEGIN
	ALTER TABLE "kb_articles"
	ADD CONSTRAINT "kb_articles_created_by_fkey" FOREIGN KEY("created_by") REFERENCES "users"("id")
	ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	ALTER TABLE "kb_articles"
	ADD CONSTRAINT "kb_articles_reviewed_by_fkey" FOREIGN KEY("reviewed_by") REFERENCES "users"("id")
	ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "kb_articles_status_idx" ON "kb_articles"("status");
