"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearBudget = exports.upsertBudget = exports.getCurrentBudget = void 0;
const budget_1 = __importStar(require("../models/budget"));
const transaction_1 = __importDefault(require("../models/transaction"));
const startOfDay = (date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
};
const endOfDay = (date) => {
    const next = new Date(date);
    next.setHours(23, 59, 59, 999);
    return next;
};
const getWeekStart = (date) => {
    const next = startOfDay(date);
    const day = next.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    next.setDate(next.getDate() + diff);
    return next;
};
const getRangeForPeriod = (period, explicitStartDate) => {
    const now = new Date();
    if (period === "week") {
        return {
            startDate: getWeekStart(now),
            endDate: endOfDay(now),
        };
    }
    if (period === "month") {
        return {
            startDate: new Date(now.getFullYear(), now.getMonth(), 1),
            endDate: endOfDay(now),
        };
    }
    return {
        startDate: explicitStartDate ? startOfDay(explicitStartDate) : startOfDay(now),
        endDate: endOfDay(now),
    };
};
const getSpentAmount = async (userId, startDate, endDate) => {
    const expenseRows = await transaction_1.default.find({
        userId,
        type: "expense",
        date: { $gte: startDate, $lte: endDate },
    }).select("amount");
    return expenseRows.reduce((sum, row) => sum + row.amount, 0);
};
const toBudgetStatus = async (userId, budget) => {
    const { startDate, endDate } = getRangeForPeriod(budget.period, budget.startDate);
    const spent = await getSpentAmount(userId, startDate, endDate);
    const remaining = budget.amount - spent;
    const utilizationPct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 999) : 0;
    return {
        amount: budget.amount,
        period: budget.period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        spent,
        remaining,
        utilizationPct,
    };
};
const getCurrentBudget = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const budget = await budget_1.default.findOne({ userId: req.userId });
        if (!budget) {
            res.status(200).json({ budget: null });
            return;
        }
        const status = await toBudgetStatus(req.userId, {
            amount: budget.amount,
            period: budget.period,
            startDate: budget.startDate,
        });
        res.status(200).json({ budget: status });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getCurrentBudget = getCurrentBudget;
const upsertBudget = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { amount, period } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ message: "amount must be greater than 0" });
            return;
        }
        if (!period || !budget_1.budgetPeriods.includes(period)) {
            res.status(400).json({ message: "period must be one of: now, week, month" });
            return;
        }
        const startDate = getRangeForPeriod(period).startDate;
        const budget = await budget_1.default.findOneAndUpdate({ userId: req.userId }, { amount, period, startDate }, { new: true, upsert: true, setDefaultsOnInsert: true });
        const status = await toBudgetStatus(req.userId, {
            amount: budget.amount,
            period: budget.period,
            startDate: budget.startDate,
        });
        res.status(200).json({ budget: status });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.upsertBudget = upsertBudget;
const clearBudget = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        await budget_1.default.findOneAndDelete({ userId: req.userId });
        res.status(200).json({ message: "Budget cleared" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.clearBudget = clearBudget;
