"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionCategories = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.transactionCategories = [
    "Food",
    "Transportation",
    "Housing",
    "Entertainment",
    "Utilities",
    "Healthcare",
    "Shopping",
    "Education",
    "Salary",
    "Freelance",
    "Investment",
    "Other",
];
const transactionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["income", "expense"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    category: {
        type: String,
        enum: exports.transactionCategories,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    description: {
        type: String,
        default: "",
        trim: true,
    },
}, { timestamps: true });
const Transaction = mongoose_1.default.model("Transaction", transactionSchema);
exports.default = Transaction;
