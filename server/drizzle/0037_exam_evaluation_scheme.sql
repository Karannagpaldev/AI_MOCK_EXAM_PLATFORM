ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "evaluation_scheme" text;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "rubric_status" text DEFAULT 'ready' NOT NULL;
