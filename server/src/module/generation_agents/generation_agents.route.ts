import { Router } from "express";
import {
    conversationTurnHandler,
    triggerBlueprintGenerationHandler,
    getBlueprintStatusHandler,
    getConversationHandler,
    blueprintReviewTurnHandler,
    getBlueprintReviewHistoryHandler,
    rebalanceBlueprintHandler,
    triggerQuestionGenerationHandler,
    getQuestionsStatusHandler,
    generateTopicQuestionsHandler,
    questionReviewTurnHandler,
    getQuestionReviewHistoryHandler,
} from "./generation_agents.controller.js";
import { authenticate, authorize } from "../../common/middleware/auth.middleware.js";

const router = Router();

router.post(
    "/conversation",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    conversationTurnHandler
);

router.post(
    "/blueprint/generate",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    triggerBlueprintGenerationHandler
);

router.post(
    "/blueprint/rebalance",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    rebalanceBlueprintHandler
);

router.get(
    "/conversation/:sessionId",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    getConversationHandler
);

router.get(
    "/blueprint/:sessionId",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    getBlueprintStatusHandler
);

router.post(
    "/review/turn",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    blueprintReviewTurnHandler
);

router.get(
    "/review/:sessionId",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    getBlueprintReviewHistoryHandler
);

// One turn of the question review chat.
router.post(
    "/question-review/turn",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    questionReviewTurnHandler
);

router.get(
    "/question-review/:examId",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    getQuestionReviewHistoryHandler
);

router.post(
    "/questions/generate",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    triggerQuestionGenerationHandler
);

router.get(
    "/questions/:sessionId",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    getQuestionsStatusHandler
);

router.post(
    "/topic/generate",
    authenticate,
    authorize("system_admin", "teacher", "manager"),
    generateTopicQuestionsHandler
);

export const generationAgentsRouter = router;
export default router;
