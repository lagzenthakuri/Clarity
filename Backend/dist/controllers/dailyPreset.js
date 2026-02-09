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
exports.applyDailyPreset = exports.deleteDailyPreset = exports.updateDailyPreset = exports.createDailyPreset = exports.listDailyPresets = void 0;
const dailyPreset_1 = __importDefault(require("../models/dailyPreset"));
const transaction_1 = __importStar(require("../models/transaction"));
const parseDate = (value) => {
    if (!value)
        return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return undefined;
    return date;
};
const validatePresetPayload = (payload) => {
    if (!payload.name || !payload.type || !payload.category || payload.amount === undefined) {
        return { valid: false, message: "name, type, amount and category are required" };
    }
    if (payload.amount <= 0) {
        return { valid: false, message: "amount must be greater than 0" };
    }
    if (!transaction_1.transactionCategories.includes(payload.category)) {
        return { valid: false, message: "Invalid category" };
    }
    return { valid: true };
};
const listDailyPresets = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const presets = await dailyPreset_1.default.find({ userId: req.userId }).sort({
            active: -1,
            updatedAt: -1,
        });
        res.status(200).json({ presets });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listDailyPresets = listDailyPresets;
const createDailyPreset = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const payload = req.body;
        const validation = validatePresetPayload(payload);
        if (!validation.valid) {
            res.status(400).json({ message: validation.message });
            return;
        }
        const preset = await dailyPreset_1.default.create({
            userId: req.userId,
            name: payload.name?.trim(),
            type: payload.type,
            amount: payload.amount,
            category: payload.category,
            description: payload.description?.trim() || "",
            active: payload.active ?? true,
        });
        res.status(201).json({ preset });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createDailyPreset = createDailyPreset;
const updateDailyPreset = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const existing = await dailyPreset_1.default.findOne({ _id: id, userId: req.userId });
        if (!existing) {
            res.status(404).json({ message: "Preset not found" });
            return;
        }
        const payload = req.body;
        if (payload.name !== undefined ||
            payload.type !== undefined ||
            payload.amount !== undefined ||
            payload.category !== undefined) {
            const merged = {
                name: payload.name ?? existing.name,
                type: payload.type ?? existing.type,
                amount: payload.amount ?? existing.amount,
                category: payload.category ?? existing.category,
            };
            const validation = validatePresetPayload(merged);
            if (!validation.valid) {
                res.status(400).json({ message: validation.message });
                return;
            }
        }
        if (payload.name !== undefined)
            existing.name = payload.name.trim();
        if (payload.type !== undefined)
            existing.type = payload.type;
        if (payload.amount !== undefined)
            existing.amount = payload.amount;
        if (payload.category !== undefined) {
            existing.category = payload.category;
        }
        if (payload.description !== undefined)
            existing.description = payload.description.trim();
        if (payload.active !== undefined)
            existing.active = payload.active;
        await existing.save();
        res.status(200).json({ preset: existing });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateDailyPreset = updateDailyPreset;
const deleteDailyPreset = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const deleted = await dailyPreset_1.default.findOneAndDelete({ _id: id, userId: req.userId });
        if (!deleted) {
            res.status(404).json({ message: "Preset not found" });
            return;
        }
        res.status(200).json({ message: "Preset deleted" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteDailyPreset = deleteDailyPreset;
const applyDailyPreset = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const { date } = req.body;
        const preset = await dailyPreset_1.default.findOne({ _id: id, userId: req.userId, active: true });
        if (!preset) {
            res.status(404).json({ message: "Active preset not found" });
            return;
        }
        const parsedDate = date ? parseDate(date) : new Date();
        if (!parsedDate) {
            res.status(400).json({ message: "Invalid date" });
            return;
        }
        const transaction = await transaction_1.default.create({
            userId: req.userId,
            type: preset.type,
            amount: preset.amount,
            category: preset.category,
            date: parsedDate,
            description: preset.description,
        });
        res.status(201).json({ transaction });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.applyDailyPreset = applyDailyPreset;
