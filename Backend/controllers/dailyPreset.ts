import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import DailyPreset from "../models/dailyPreset";
import Transaction, { transactionCategories } from "../models/transaction";

type TransactionCategory = (typeof transactionCategories)[number];

const parseDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const validatePresetPayload = (payload: {
  name?: string;
  type?: "income" | "expense";
  amount?: number;
  category?: string;
  description?: string;
  active?: boolean;
}): { valid: true } | { valid: false; message: string } => {
  if (!payload.name || !payload.type || !payload.category || payload.amount === undefined) {
    return { valid: false, message: "name, type, amount and category are required" };
  }

  if (payload.amount <= 0) {
    return { valid: false, message: "amount must be greater than 0" };
  }

  if (!transactionCategories.includes(payload.category as (typeof transactionCategories)[number])) {
    return { valid: false, message: "Invalid category" };
  }

  return { valid: true };
};

export const listDailyPresets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const presets = await DailyPreset.find({ userId: req.userId }).sort({
      active: -1,
      updatedAt: -1,
    });

    res.status(200).json({ presets });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const createDailyPreset = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const payload = req.body as {
      name?: string;
      type?: "income" | "expense";
      amount?: number;
      category?: string;
      description?: string;
      active?: boolean;
    };

    const validation = validatePresetPayload(payload);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    const preset = await DailyPreset.create({
      userId: req.userId,
      name: payload.name?.trim(),
      type: payload.type,
      amount: payload.amount,
      category: payload.category,
      description: payload.description?.trim() || "",
      active: payload.active ?? true,
    });

    res.status(201).json({ preset });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateDailyPreset = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const existing = await DailyPreset.findOne({ _id: id, userId: req.userId });
    if (!existing) {
      res.status(404).json({ message: "Preset not found" });
      return;
    }

    const payload = req.body as {
      name?: string;
      type?: "income" | "expense";
      amount?: number;
      category?: string;
      description?: string;
      active?: boolean;
    };

    if (
      payload.name !== undefined ||
      payload.type !== undefined ||
      payload.amount !== undefined ||
      payload.category !== undefined
    ) {
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

    if (payload.name !== undefined) existing.name = payload.name.trim();
    if (payload.type !== undefined) existing.type = payload.type;
    if (payload.amount !== undefined) existing.amount = payload.amount;
    if (payload.category !== undefined) {
      existing.category = payload.category as TransactionCategory;
    }
    if (payload.description !== undefined) existing.description = payload.description.trim();
    if (payload.active !== undefined) existing.active = payload.active;

    await existing.save();
    res.status(200).json({ preset: existing });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteDailyPreset = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const deleted = await DailyPreset.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deleted) {
      res.status(404).json({ message: "Preset not found" });
      return;
    }

    res.status(200).json({ message: "Preset deleted" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const applyDailyPreset = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { date } = req.body as { date?: string };
    const preset = await DailyPreset.findOne({ _id: id, userId: req.userId, active: true });

    if (!preset) {
      res.status(404).json({ message: "Active preset not found" });
      return;
    }

    const parsedDate = date ? parseDate(date) : new Date();
    if (!parsedDate) {
      res.status(400).json({ message: "Invalid date" });
      return;
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      type: preset.type,
      amount: preset.amount,
      category: preset.category,
      date: parsedDate,
      description: preset.name,
    });

    res.status(201).json({ transaction });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
