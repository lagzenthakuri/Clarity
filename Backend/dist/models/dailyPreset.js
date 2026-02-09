"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const transaction_1 = require("./transaction");
const dailyPresetSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
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
        enum: transaction_1.transactionCategories,
        required: true,
    },
    description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 180,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
const DailyPreset = mongoose_1.default.model("DailyPreset", dailyPresetSchema);
exports.default = DailyPreset;
