import { Router } from "express";
import * as controller from "./ai_usage.controller.js";
import { authenticate, authorize } from "../../common/middleware/auth.middleware.js";

const router = Router();

// The AI usage dashboard: system admins only.
router.get("/summary", authenticate, authorize("system_admin"), controller.getSummary);
router.get("/logs", authenticate, authorize("system_admin"), controller.getLogs);
router.get("/logs/export", authenticate, authorize("system_admin"), controller.exportLogs);
router.get("/prices", authenticate, authorize("system_admin"), controller.getPrices);

export default router;
