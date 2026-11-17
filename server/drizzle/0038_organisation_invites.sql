CREATE TABLE IF NOT EXISTS "organisation_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"organisation_id" text NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" text,
	"expires_at" timestamp NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organisation_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organisation_invites" ADD CONSTRAINT "organisation_invites_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organisation_invites" ADD CONSTRAINT "organisation_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organisation_invites_org_idx" ON "organisation_invites" USING btree ("organisation_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organisation_invites_pending_idx" ON "organisation_invites" USING btree ("organisation_id","email") WHERE "organisation_invites"."status" = 'pending';
