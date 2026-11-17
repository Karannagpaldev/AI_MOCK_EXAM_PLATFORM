import { evaluateAnswer, isBlankAnswer, type EvaluationOutcome, type ResponseMode, type TextAnswer } from "./evalutaion.js";

// Grades a list of written answers one answer at a time and saves each as soon as it is done (through `save`, so exams and
// assignments can store them in their own tables). Shared by the exam and assignment grading jobs.

// How a grading run is paid for, one answer at a time: `claim` asks whether another answer may be graded, `charge` counts it
// once it is graded, and `release` gives the place back.
export interface GradeGate {
    claim(): Promise<boolean>;
    charge(): Promise<void>;
    release(): void;
}

export interface GradeSummary {
    graded: number;
    // Not graded because the organisation's plan has no AI grading left.
    outOfQuota: TextAnswer[];
    // Failures that are worth trying again (the job retries; answers already graded are kept).
    failures: unknown[];
}

export const gradeAnswers = async (
    items: TextAnswer[],
    mode: ResponseMode,
    save: (answer: TextAnswer, outcome: EvaluationOutcome) => Promise<void>,
    gate?: GradeGate
): Promise<GradeSummary> => {
    const summary: GradeSummary = { graded: 0, outOfQuota: [], failures: [] };

    await Promise.all(items.map(async (answer) => {
        // An empty answer is marked 0 without any AI work, so it is neither charged nor held up by the plan.
        const needsAi = !isBlankAnswer(answer.studentAnswer);
        let claimed = false;
        if (needsAi && gate) {
            if (!(await gate.claim())) {
                summary.outOfQuota.push(answer);
                return;
            }
            claimed = true;
        }

        try {
            const outcome = await evaluateAnswer(answer, mode);
            await save(answer, outcome);
            if (claimed) await gate!.charge();
            summary.graded++;
        } catch (err) {
            summary.failures.push(err);
        } finally {
            if (claimed) gate!.release();
        }
    }));

    return summary;
};

