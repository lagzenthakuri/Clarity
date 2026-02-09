import { Router } from "express";
import { googleLogin, login, me, signup } from "../controllers/auth";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", authMiddleware, me);

export default router;
