-- The topic and subtopic a question was generated for. Null for hand-written questions and for exams made before
-- topics were tracked. Lets an exam's topics be listed, and a topic's questions removed together.
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "topic" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "subtopic" text;
