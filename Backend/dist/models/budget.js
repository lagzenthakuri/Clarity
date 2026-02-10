"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetPeriods = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.budgetPeriods = ["now", "week", "month"];
const budgetSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    period: {
        type: String,
        enum: exports.budgetPeriods,
        required: true,
        default: "month",
    },
    startDate: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
budgetSchema.index({ userId: 1 }, { unique: true });
const Budget = mongoose_1.default.model("Budget", budgetSchema);
exports.default = Budget;
