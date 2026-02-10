import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import Budget, { budgetPeriods } from "../models/budget";
import Transaction from "../models/transaction";

type BudgetPeriod = (typeof budgetPeriods)[number];

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const getWeekStart = (date: Date): Date => {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
};

const getRangeForPeriod = (
  period: BudgetPeriod,
  explicitStartDate?: Date
): { startDate: Date; endDate: Date } => {
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

const getSpentAmount = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const expenseRows = await Transaction.find({
    userId,
    type: "expense",
    date: { $gte: startDate, $lte: endDate },
  }).select("amount");

  return expenseRows.reduce((sum, row) => sum + row.amount, 0);
};

const toBudgetStatus = async (
  userId: string,
  budget: { amount: number; period: BudgetPeriod; startDate: Date }
): Promise<{
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  spent: number;
  remaining: number;
  utilizationPct: number;
}> => {
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

export const getCurrentBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const budget = await Budget.findOne({ userId: req.userId });

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
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const upsertBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { amount, period } = req.body as {
      amount?: number;
      period?: BudgetPeriod;
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ message: "amount must be greater than 0" });
      return;
    }

    if (!period || !budgetPeriods.includes(period)) {
      res.status(400).json({ message: "period must be one of: now, week, month" });
      return;
    }

    const startDate = getRangeForPeriod(period).startDate;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId },
      { amount, period, startDate },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const status = await toBudgetStatus(req.userId, {
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate,
    });

    res.status(200).json({ budget: status });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const clearBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await Budget.findOneAndDelete({ userId: req.userId });
    res.status(200).json({ message: "Budget cleared" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
