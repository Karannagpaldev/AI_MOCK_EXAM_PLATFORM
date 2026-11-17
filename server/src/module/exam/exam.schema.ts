import { pgTable, text, integer, doublePrecision, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "../auth/user.schema.js";
import { classrooms } from "../classrooms/classroom.schema.js";
import { groups } from "../groups/group.schema.js";

export const exams = pgTable("exams", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  type: text("type").$type<"SCHEDULED" | "ON_DEMAND">().default("SCHEDULED").notNull(),
  instructions: text("instructions").array(),
  duration: integer("duration").notNull(), // in minutes
  createdBy: text("created_by").references(() => users.id).notNull(),
  // Nullable for backward compatibility with exams created before classroom scoping
  // existed. New exams should always set classroomId; groupId null = class-wide,
  // set = restricted to that group's members.
  classroomId: text("classroom_id").references(() => classrooms.id, { onDelete: "cascade" }),
  groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
  // Kept regardless of classroom scoping — a classroom/group member can start the
  // exam directly via membership (no code), but the code still works as-is.
  joinCode: text("join_code").unique().notNull(),
  totalMarks: doublePrecision("total_marks").notNull(),
  requireFeedback: boolean("require_feedback").default(false).notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  publishTime: timestamp("publish_time"),
  // UNSAVED is the working copy of an exam the teacher is still building: it exists so questions have somewhere to be
  // written, but it stays hidden from every list until they choose Save as Draft or Publish.
  status: text("status").$type<"DRAFT" | "PUBLISHED" | "UNSAVED">().default("DRAFT").notNull(),
  // Creator opts in to let co-teachers of the classroom edit this exam's content.
  allowCoTeacherEdit: boolean("allow_co_teacher_edit").default(false).notNull(),
  // How the teacher marks written answers and how students should write them, in their own words (asked on the publish step).
  // Used when each written question's grading guide (rubric) is written.
  evaluationScheme: text("evaluation_scheme"),
  // Whether the written questions' grading guides are ready. "pending" holds AI grading back (students' answers wait in
  // "evaluating"); "failed" means the guides could not be written, and answers are then graded without them.
  rubricStatus: text("rubric_status").$type<"pending" | "ready" | "failed">().default("ready").notNull(),
  // "Evaluate written answers with AI" on the publish step. Off: no grading guides are written and written answers wait for
  // the teacher to grade them. MCQs are marked by comparing with the correct option either way, never by AI.
  aiEvaluation: boolean("ai_evaluation").default(true).notNull(),
  // The past papers (question bank documents) this exam's questions were taken from. Set when questions are added from
  // past papers, so adding a topic later offers those papers' topics. null for exams made any other way.
  sourceDocumentIds: jsonb("source_document_ids").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
