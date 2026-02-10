"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const budgets_1 = __importDefault(require("./routes/budgets"));
const dailyPresets_1 = __importDefault(require("./routes/dailyPresets"));
const insights_1 = __importDefault(require("./routes/insights"));
const transactions_1 = __importDefault(require("./routes/transactions"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 8001);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/clarity";
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/api/health", (_req, res) => {
    res.status(200).json({ message: "Clarity API is running" });
});
app.use("/api/auth", auth_1.default);
app.use("/api/transactions", transactions_1.default);
app.use("/api/budgets", budgets_1.default);
app.use("/api/daily-presets", dailyPresets_1.default);
app.use("/api/insights", insights_1.default);
app.use((error, _req, res, _next) => {
    res.status(500).json({ message: error.message || "Something went wrong" });
});
const start = async () => {
    try {
        await mongoose_1.default.connect(mongoUri);
        app.listen(port, () => {
            console.log(`Clarity backend listening on http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
};
start();
