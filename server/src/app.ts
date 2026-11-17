import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { serve } from "inngest/express";
import authRoutes from "./module/auth/auth.route.js";
import organisationsRouter from "./module/organisations/organisation.route.js";
import classroomsRouter from "./module/classrooms/classroom.route.js";
import groupsRouter from "./module/groups/group.route.js";
import assignmentsRouter from "./module/assignments/assignment.route.js";
import examRouter from "./module/exam/exam.route.js";
import sectionsRouter from "./module/sections/section.routes.js";
import questionsRouter from "./module/questions/question.route.js";
import optionsRouter from "./module/options/option.route.js";
import submissionsRouter from "./module/submissions/submission.route.js";
import answersRouter from "./module/answers/answer.route.js";
import superadminRouter from "./module/superadmin/superadmin.route.js";
import aiUsageRouter from "./module/ai_usage/ai_usage.route.js";
import feedbackRouter from "./module/feedback/feedback.route.js";
import jobsRouter from "./module/jobs/jobs.route.js";
import speechRouter from "./module/speech/speech.route.js";
import generationAgentsRouter from "./module/generation_agents/generation_agents.route.js";
import { inngest } from "./common/inngest/client.js";
import { generationAgentFunctions } from "./module/generation_agents/inngest/functions.js";
import questionBankRouter from "./module/question_bank/question_bank.route.js";
import { questionBankFunctions } from "./module/question_bank/inngest/functions.js";
import bookRouter from "./module/books/book.route.js";
import { bookFunctions } from "./module/books/inngest/functions.js";
import { rubricFunctions } from "./module/rubrics/inngest/functions.js";
import billingRouter from "./module/billing/billing.route.js";
import studentProfileRouter from "./module/student-profile/student-profile.route.js";
import errorHandler from "./common/middleware/error.middleware.js";
import 'dotenv/config'
const app = express();

// Behind Render's proxy: without this every visitor looks like the same IP, so the rate limiters (and anything else
// that reads the client's address) would treat all users as one.
app.set("trust proxy", 1);

// For the host's health check. Deliberately cheap and open: no login, no database call, so a database hiccup doesn't
// make the host restart a server that is otherwise fine.
app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});

// FRONTEND_URL can list several addresses separated by commas. While developing, any address on the home network
// (192.168.x.x, 10.x.x.x, 172.16-31.x.x) is accepted too, so a phone on the same Wi-Fi can use the site. Never in production.
const frontendUrls = (process.env.FRONTEND_URL || "http://localhost:3000").split(",").map((url) => url.trim()).filter(Boolean);
const HOME_NETWORK_ORIGIN = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(cors({
    origin: (origin, callback) => {
        const allowed = !origin || frontendUrls.includes(origin) || (process.env.NODE_ENV !== "production" && HOME_NETWORK_ORIGIN.test(origin));
        callback(null, allowed);
    },
    credentials: true,
}));

// Inngest sends the results of every completed step with each call, so a long job (a whole book) quickly
// outgrows the 100 KB default body limit. Registered before the global parser so this limit applies.
app.use("/api/inngest", express.json({ limit: "50mb" }), serve({ client: inngest, functions: [...generationAgentFunctions, ...questionBankFunctions, ...bookFunctions, ...rubricFunctions] }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/organisations", organisationsRouter)
app.use("/api/classrooms", classroomsRouter)
app.use("/api/groups", groupsRouter)
app.use("/api/assignments", assignmentsRouter)
app.use("/api/exams", examRouter)
app.use("/api/sections", sectionsRouter)
app.use("/api/questions", questionsRouter)
app.use("/api/options", optionsRouter)
app.use("/api/submissions", submissionsRouter)
app.use("/api/answers", answersRouter)
app.use("/api/superadmin", superadminRouter)
app.use("/api/ai-usage", aiUsageRouter)
app.use("/api/feedback", feedbackRouter)
app.use("/api/generation-agents", generationAgentsRouter);
app.use("/api/question-bank", questionBankRouter);
app.use("/api/books", bookRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/speech", speechRouter);
app.use("/api/billing", billingRouter);
app.use("/api/student-profile", studentProfileRouter);
app.use(errorHandler)

export default app;

// Trigger restart