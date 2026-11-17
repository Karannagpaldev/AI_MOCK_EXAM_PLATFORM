import { pgTable, text, integer, doublePrecision, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "../auth/user.schema.js";
import { classrooms } from "../classrooms/classroom.schema.js";
import { groups } from "../groups/group.schema.js";
import { questionTypeEnum } from "../questions/question-type.enum.js";
import { blocks } from "../blocks/block.schema.js";
import type { QuestionContentBlock } from "../questions/question.schema.js";

// weekly = dates computed per student, relative to their enrollment date
// (chained via dayGap/unlockOffsetDays). custom = teacher sets a fixed
// start/due date per assignment, same for the whole classroom.
export const seriesTypeEnum = pgEnum("series_type", ["weekly", "custom"]);

// A named, ordered container of assignments — e.g. "AI Course - Weekly
// Assignments" with 24 weekly entries. Scoped to a classroom (+ optional group).
export const assignmentSeries = pgTable("assignment_series", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  type: seriesTypeEnum("type").default("weekly").notNull(),
  classroomId: text("classroom_id").references(() => classrooms.id, { onDelete: "cascade" }).notNull(),
  groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
  createdBy: text("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Always scoped to a classroom; groupId null = class-wide, set = restricted to
// that group's members. No sections layer — a flat list of questions.
export const assignments = pgTable("assignments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  instructions: text("instructions"),
  classroomId: text("classroom_id").references(() => classrooms.id, { onDelete: "cascade" }).notNull(),
  groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
  createdBy: text("created_by").references(() => users.id).notNull(),
  totalMarks: doublePrecision("total_marks").notNull(),
  // Standalone (non-series) assignments only: a manually-set absolute date
  // gate ("don't allow starting before this date") and a manual due date.
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  // Series fields. seriesId + sequenceOrder place this assignment in an
  // ordered drip series (e.g. week 1..24). dayGap = how many days this
  // assignment's own window lasts (replaces a manual dueDate). unlockOffsetDays
  // = stored cumulative days-after-enrollment this assignment starts — chained
  // from the previous assignment's (unlockOffsetDays + dayGap + 1), but stored
  // (not recomputed live) so an "extend without cascade" can freeze it.
  seriesId: text("series_id").references(() => assignmentSeries.id, { onDelete: "cascade" }),
  sequenceOrder: integer("sequence_order"),
  dayGap: integer("day_gap"),
  unlockOffsetDays: integer("unlock_offset_days"),
  // "Evaluate written answers with AI" on the publish step. Off: written answers wait for the teacher to grade them.
  // MCQs are marked by comparing with the correct option either way, never by AI.
  aiEvaluation: boolean("ai_evaluation").default(true).notNull(),
  // How the teacher marks written answers, in their own words. The written questions' grading guides are written from it.
  evaluationScheme: text("evaluation_scheme"),
  // Whether the written questions' grading guides are ready. "pending" holds AI grading back (answers wait in
  // "evaluating"); "failed" means they could not be written, and answers are then graded without them.
  rubricStatus: text("rubric_status").$type<"pending" | "ready" | "failed">().default("ready").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reuses the same question_type enum as exam questions (mcq | descriptive).
export const assignmentQuestions = pgTable("assignment_questions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  assignmentId: text("assignment_id").references(() => assignments.id, { onDelete: "cascade" }).notNull(),
  blockId: text("block_id").references(() => blocks.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  // The question's place in the assignment, from 0. Questions copied from an exam keep the exam's order.
  position: integer("position").default(0).notNull(),
  images: jsonb("images").$type<{ url: string; publicId: string }[]>(),
  // Code, tables, lists and pictures shown under the question text, as on an exam question.
  contentBlocks: jsonb("content_blocks").$type<QuestionContentBlock[]>().default([]).notNull(),
  // The topic and subtopic the question was made for, copied from the exam. Null for questions written by hand.
  topic: text("topic"),
  subtopic: text("subtopic"),
  marks: doublePrecision("marks").notNull(),
  modelAnswer: text("model_answer"),
  rubric: jsonb("rubric").$type<{ categories: { name: string; weight: number; key_points: string[] }[] }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assignmentOptions = pgTable("assignment_options", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  questionId: text("question_id").references(() => assignmentQuestions.id, { onDelete: "cascade" }).notNull(),
  value: text("value").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  // The option is shown as code (exact spacing, code font), as on an exam option.
  isCode: boolean("is_code").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  assignmentId: text("assignment_id").references(() => assignments.id, { onDelete: "cascade" }).notNull(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: text("status").$type<"in_progress" | "submitted" | "graded" | "evaluating">().default("in_progress").notNull(),
  submittedAt: timestamp("submitted_at"),
  isLate: boolean("is_late").default(false).notNull(),
  totalMarksAwarded: doublePrecision("total_marks_awarded"),
  overallFeedback: text("overall_feedback"),
  gradedBy: text("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // null = active, timestamp = deleted
});

export const assignmentAnswers = pgTable("assignment_answers", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  submissionId: text("submission_id").references(() => assignmentSubmissions.id, { onDelete: "cascade" }).notNull(),
  questionId: text("question_id").references(() => assignmentQuestions.id, { onDelete: "cascade" }).notNull(),
  options: text("options").array(), // array of assignment_option ids, for mcq
  textAnswer: text("text_answer"),
  marksAwarded: doublePrecision("marks_awarded"),
  feedback: text("feedback"), // per-question teacher feedback
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AssignmentSeries = typeof assignmentSeries.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type AssignmentQuestion = typeof assignmentQuestions.$inferSelect;
export type AssignmentOption = typeof assignmentOptions.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type AssignmentAnswer = typeof assignmentAnswers.$inferSelect;
