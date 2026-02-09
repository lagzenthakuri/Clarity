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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardSummary = exports.deleteTransaction = exports.updateTransaction = exports.listTransactions = exports.createTransaction = void 0;
const transaction_1 = __importStar(require("../models/transaction"));
const categoryKeywords = {
    Food: ["zomato", "swiggy", "restaurant", "dining", "snack", "coffee", "food"],
    Transportation: ["uber", "ola", "bus", "metro", "taxi", "fuel", "petrol", "train"],
    Housing: ["rent", "landlord", "maintenance", "mortgage"],
    Entertainment: ["movie", "netflix", "spotify", "concert", "game"],
    Utilities: ["electricity", "water bill", "internet", "wifi", "gas bill", "phone bill"],
    Healthcare: ["doctor", "clinic", "medicine", "pharmacy", "hospital"],
    Shopping: ["amazon", "flipkart", "store", "mall", "shopping"],
    Education: ["course", "tuition", "book", "college", "exam fee"],
    Salary: ["salary", "payroll", "paycheck"],
    Freelance: ["freelance", "client payment", "project fee"],
    Investment: ["dividend", "interest", "mutual fund", "stocks", "sip"],
    Other: [],
};
const parseDate = (value) => {
    if (!value)
        return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return undefined;
    return date;
};
const detectCategoryFromDescription = (description) => {
    const normalized = description.toLowerCase();
    for (const category of transaction_1.transactionCategories) {
        for (const keyword of categoryKeywords[category]) {
            if (normalized.includes(keyword)) {
                return { category, keyword };
            }
        }
    }
    return null;
};
const decideCategoryAndReason = (args) => {
    const { selectedCategory, description, type } = args;
    const detected = detectCategoryFromDescription(description);
    if (!detected) {
        return { category: selectedCategory, reason: "Selected manually" };
    }
    if (selectedCategory === "Other") {
        const allowedForType = type === "income"
            ? new Set(["Salary", "Freelance", "Investment", "Other"])
            : new Set(transaction_1.transactionCategories.filter((item) => item !== "Salary" && item !== "Freelance" && item !== "Investment"));
        if (allowedForType.has(detected.category)) {
            return {
                category: detected.category,
                reason: `Matched keyword "${detected.keyword}" in description`,
            };
        }
    }
    if (detected.category === selectedCategory) {
        return {
            category: selectedCategory,
            reason: `Matched keyword "${detected.keyword}" in description`,
        };
    }
    return { category: selectedCategory, reason: "Selected manually" };
};
const createTransaction = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { type, amount, category, date, description } = req.body;
        if (!type || !amount || !category || !date) {
            res.status(400).json({ message: "type, amount, category and date are required" });
            return;
        }
        if (!transaction_1.transactionCategories.includes(category)) {
            res.status(400).json({ message: "Invalid category" });
            return;
        }
        const parsedDate = parseDate(date);
        if (!parsedDate) {
            res.status(400).json({ message: "Invalid date" });
            return;
        }
        const finalCategory = category;
        const { category: resolvedCategory, reason } = decideCategoryAndReason({
            selectedCategory: finalCategory,
            description: description || "",
            type,
        });
        const transaction = await transaction_1.default.create({
            userId: req.userId,
            type,
            amount,
            category: resolvedCategory,
            date: parsedDate,
            description: description || "",
            categorizationReason: reason,
        });
        res.status(201).json({ transaction });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createTransaction = createTransaction;
const listTransactions = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { category, startDate, endDate, type } = req.query;
        const query = { userId: req.userId };
        if (category)
            query.category = category;
        if (type)
            query.type = type;
        const parsedStart = parseDate(startDate);
        const parsedEnd = parseDate(endDate);
        if (parsedStart || parsedEnd) {
            query.date = {};
            if (parsedStart) {
                query.date.$gte = parsedStart;
            }
            if (parsedEnd) {
                query.date.$lte = parsedEnd;
            }
        }
        const transactions = await transaction_1.default.find(query).sort({ date: -1, createdAt: -1 });
        res.status(200).json({ transactions });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listTransactions = listTransactions;
const updateTransaction = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const existing = await transaction_1.default.findOne({ _id: id, userId: req.userId });
        if (!existing) {
            res.status(404).json({ message: "Transaction not found" });
            return;
        }
        const nextValues = req.body;
        if (nextValues.category) {
            const validCategory = transaction_1.transactionCategories.includes(nextValues.category);
            if (!validCategory) {
                res.status(400).json({ message: "Invalid category" });
                return;
            }
        }
        if (nextValues.date) {
            const parsedDate = parseDate(nextValues.date);
            if (!parsedDate) {
                res.status(400).json({ message: "Invalid date" });
                return;
            }
            existing.date = parsedDate;
        }
        if (nextValues.type)
            existing.type = nextValues.type;
        if (nextValues.amount)
            existing.amount = nextValues.amount;
        if (typeof nextValues.description === "string")
            existing.description = nextValues.description;
        if (nextValues.category || typeof nextValues.description === "string" || nextValues.type) {
            const selectedCategory = (nextValues.category
                ? nextValues.category
                : existing.category);
            const { category: resolvedCategory, reason } = decideCategoryAndReason({
                selectedCategory,
                description: existing.description || "",
                type: existing.type,
            });
            existing.category = resolvedCategory;
            existing.categorizationReason = reason;
        }
        await existing.save();
        res.status(200).json({ transaction: existing });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateTransaction = updateTransaction;
const deleteTransaction = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const deleted = await transaction_1.default.findOneAndDelete({ _id: id, userId: req.userId });
        if (!deleted) {
            res.status(404).json({ message: "Transaction not found" });
            return;
        }
        res.status(200).json({ message: "Transaction deleted" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteTransaction = deleteTransaction;
const dashboardSummary = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { startDate, endDate } = req.query;
        const query = { userId: req.userId };
        const parsedStart = parseDate(startDate);
        const parsedEnd = parseDate(endDate);
        if (parsedStart || parsedEnd) {
            query.date = {};
            if (parsedStart) {
                query.date.$gte = parsedStart;
            }
            if (parsedEnd) {
                query.date.$lte = parsedEnd;
            }
        }
        const transactions = (await transaction_1.default.find(query));
        const totalIncome = transactions
            .filter((transaction) => transaction.type === "income")
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        const totalExpense = transactions
            .filter((transaction) => transaction.type === "expense")
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        const byCategory = transactions
            .filter((transaction) => transaction.type === "expense")
            .reduce((acc, transaction) => {
            acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
            return acc;
        }, {});
        res.status(200).json({
            summary: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                byCategory,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.dashboardSummary = dashboardSummary;
