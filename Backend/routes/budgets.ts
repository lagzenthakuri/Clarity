import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { clearBudget, getCurrentBudget, upsertBudget } from "../controllers/budget";

const router = Router();

router.use(authMiddleware);
router.get("/current", getCurrentBudget);
router.post("/current", upsertBudget);
router.delete("/current", clearBudget);

export default router;
