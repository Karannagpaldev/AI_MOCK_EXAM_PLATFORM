import type { Request, Response } from "express";
import { ApiResponse } from "../../common/utils/ApiResponse.js";
import * as examService from "./exam.service.js";
import { addPaperTopicsToExam, addTopicToExam, removeTopicFromExam } from "./exam_topics.service.js";
import { assertDocumentsReady } from "../question_bank/question_bank.controller.js";
import { assertQuota, recordUsage } from "../billing/usage.service.js";

const toRequester = (req: Request) => ({
    id: req.user!.id,
    role: req.user!.role,
    organisationId: req.user!.organisationId ?? null,
});

export const createExam = async (req: Request, res: Response) => {
    const exam = await examService.createExam(req.body, toRequester(req));
    return ApiResponse.created(res, "Exam created successfully", exam);
};

export const saveGeneratedExam = async (req: Request, res: Response) => {
    const exam = await examService.saveGeneratedExam(req.body, toRequester(req));
    return ApiResponse.created(res, "Generated exam saved successfully", exam);
};

export const getExams = async (req: Request, res: Response) => {
    const { search, days, page, limit } = req.query;
    const examsData = await examService.getExams(
        req.user!.id,
        search as string,
        days as string,
        Number(page) || 1,
        Number(limit) || 10
    );
    return ApiResponse.ok(res, "Exams fetched successfully", examsData);
};

export const getExamById = async (req: Request, res: Response) => {
    const exam = await examService.getExamById(req.params.id as string, toRequester(req));
    return ApiResponse.ok(res, "Exam fetched successfully", exam);
};

export const listExamsForClassroom = async (req: Request, res: Response) => {
    const examsData = await examService.listExamsForClassroom(
        req.params.classroomId as string,
        toRequester(req),
        req.query.groupId as string | undefined,
        req.query.search as string | undefined,
        req.query.status as string | undefined,
        Number(req.query.page) || 1,
        Number(req.query.limit) || 9
    );
    return ApiResponse.ok(res, "Exams", examsData);
};

export const updateExam = async (req: Request, res: Response) => {
    const exam = await examService.updateExam(req.params.id as string, req.body, toRequester(req));
    return ApiResponse.ok(res, "Exam updated successfully", exam);
};

export const deleteExam = async (req: Request, res: Response) => {
    await examService.deleteExam(req.params.id as string, toRequester(req));
    return ApiResponse.ok(res, "Exam deleted successfully", null);
};

export const getOverviewStats = async (req: Request, res: Response) => {
    const stats = await examService.getOverviewStats(req.user!.id);
    return ApiResponse.ok(res, "Overview stats fetched successfully", stats);
};

export const getMyExams = async (req: Request, res: Response) => {
    const exams = await examService.getMyExams(
        req.user!.id,
        req.query.classroomId as string | undefined,
        req.query.groupId as string | undefined,
        req.query.search as string | undefined,
        req.query.category as string | undefined,
        Number(req.query.page) || 1,
        Number(req.query.limit) || 10
    );
    return ApiResponse.ok(res, "Your exams", exams);
};

export const addTopic = async (req: Request, res: Response) => {
    const result = await addTopicToExam(req.params.id as string, req.body, toRequester(req));
    return ApiResponse.ok(res, "Topic added", result);
};

// Adds questions from the past papers the exam was made from (no AI): the subtopics picked and how many of each.
export const addTopicFromPapers = async (req: Request, res: Response) => {
    // Metered like the past-paper picker: checked up front for the requested count, recorded for what was added.
    const organisationId = req.user?.organisationId ?? null;
    const requested = Array.isArray(req.body?.picks) ? req.body.picks.reduce((n: number, p: any) => n + (Number(p?.count) || 0), 0) : 0;
    if (organisationId && requested > 0) await assertQuota(organisationId, "question_generation", requested);
    const result = await addPaperTopicsToExam(req.params.id as string, req.body, toRequester(req), (ids) => assertDocumentsReady(ids, req));
    if (organisationId) {
        try {
            await recordUsage(organisationId, "question_generation", result.added);
        } catch (meterErr) {
            console.error(`[Billing] Failed to record generation usage for org ${organisationId}:`, meterErr);
        }
    }
    return ApiResponse.ok(res, "Questions added from the papers", result);
};

export const removeTopic = async (req: Request, res: Response) => {
    const result = await removeTopicFromExam(req.params.id as string, req.body, toRequester(req));
    return ApiResponse.ok(res, "Topic removed", result);
};
