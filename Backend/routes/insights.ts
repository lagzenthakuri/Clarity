import { Router } from "express";
import { dailySummaryAdvice } from "../controllers/insights";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.post("/daily-summary", dailySummaryAdvice);

export default router;
