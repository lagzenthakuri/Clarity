import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  applyDailyPreset,
  createDailyPreset,
  deleteDailyPreset,
  listDailyPresets,
  updateDailyPreset,
} from "../controllers/dailyPreset";

const router = Router();

router.use(authMiddleware);
router.get("/", listDailyPresets);
router.post("/", createDailyPreset);
router.put("/:id", updateDailyPreset);
router.delete("/:id", deleteDailyPreset);
router.post("/:id/apply", applyDailyPreset);

export default router;
