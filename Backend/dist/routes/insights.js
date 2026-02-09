"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const insights_1 = require("../controllers/insights");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post("/daily-summary", insights_1.dailySummaryAdvice);
exports.default = router;
