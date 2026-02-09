import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import dailyPresetRoutes from "./routes/dailyPresets";
import insightsRoutes from "./routes/insights";
import transactionRoutes from "./routes/transactions";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8001);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/clarity";

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Clarity API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/daily-presets", dailyPresetRoutes);
app.use("/api/insights", insightsRoutes);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ message: error.message || "Something went wrong" });
});

const start = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
      console.log(`Clarity backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
