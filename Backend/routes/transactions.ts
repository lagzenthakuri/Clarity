import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  createTransaction,
  dashboardSummary,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "../controllers/transaction";

const router = Router();

router.use(authMiddleware);
router.get("/dashboard", dashboardSummary);
router.get("/", listTransactions);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
