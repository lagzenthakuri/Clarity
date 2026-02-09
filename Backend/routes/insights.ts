import { Router } from "express";
import { dailySummaryAdvice, dashboardIntelligence } from "../controllers/insights";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.get("/dashboard-intelligence", dashboardIntelligence);
router.post("/daily-summary", dailySummaryAdvice);

export default router;
