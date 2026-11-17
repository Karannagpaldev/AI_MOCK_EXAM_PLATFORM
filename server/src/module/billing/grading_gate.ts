import { ApiError } from "../../common/utils/ApiError.js";
import type { GradeGate } from "../evalutaion/grading.js";
import { assertQuota, recordUsage } from "./usage.service.js";

// Answers being graded for an organisation right now, so that many students submitting at once cannot each be told "there is
// quota left" by the same stale number: every place claimed is counted until its use has been recorded.
const gradingInFlight = new Map<string, number>();

// 402 (no plan / metric not included) and 429 (over quota) are the expected "can't grade right now" answers. Anything else is
// a real failure and must not silently switch AI grading off.
const isOutOfQuota = (err: unknown) => err instanceof ApiError && (err.statusCode === 402 || err.statusCode === 429);

// Counts AI-graded answers against the organisation's "question evaluation" quota, one answer at a time.
export const organisationGradeGate = (organisationId: string): GradeGate => {
    const release = () => {
        const n = (gradingInFlight.get(organisationId) ?? 1) - 1;
        if (n <= 0) gradingInFlight.delete(organisationId);
        else gradingInFlight.set(organisationId, n);
    };
    return {
        async claim() {
            gradingInFlight.set(organisationId, (gradingInFlight.get(organisationId) ?? 0) + 1);
            try {
                // Every answer being graded right now, this one included, has to fit in what is left.
                await assertQuota(organisationId, "question_evaluation", gradingInFlight.get(organisationId) ?? 1);
                return true;
            } catch (err) {
                release();
                if (isOutOfQuota(err)) return false;
                throw err;
            }
        },
        // Never fails the grading: the answer is already saved, and losing a counter must not lose the work.
        async charge() {
            try {
                await recordUsage(organisationId, "question_evaluation", 1);
            } catch (meterErr) {
                console.error(`[Billing] Failed to record evaluation usage for org ${organisationId}:`, meterErr);
            }
        },
        release,
    };
};

// The same counting for a teacher who asked for AI grading themselves: the plan was already checked for the whole batch.
export const alreadyCheckedGate = (organisationId: string | null): GradeGate | undefined => {
    if (!organisationId) return undefined;
    const gate = organisationGradeGate(organisationId);
    return { claim: async () => true, charge: gate.charge, release: () => undefined };
};
