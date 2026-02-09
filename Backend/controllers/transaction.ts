import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import Transaction, { transactionCategories } from "../models/transaction";

const parseDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

export const createTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { type, amount, category, date, description } = req.body as {
      type?: "income" | "expense";
      amount?: number;
      category?: string;
      date?: string;
      description?: string;
    };

    if (!type || !amount || !category || !date) {
      res.status(400).json({ message: "type, amount, category and date are required" });
      return;
    }

    if (!transactionCategories.includes(category as (typeof transactionCategories)[number])) {
      res.status(400).json({ message: "Invalid category" });
      return;
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      res.status(400).json({ message: "Invalid date" });
      return;
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      amount,
      category,
      date: parsedDate,
      description: description || "",
    });

    res.status(201).json({ transaction });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const listTransactions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { category, startDate, endDate, type } = req.query as {
      category?: string;
      startDate?: string;
      endDate?: string;
      type?: "income" | "expense";
    };

    const query: Record<string, unknown> = { userId: req.userId };

    if (category) query.category = category;
    if (type) query.type = type;

    const parsedStart = parseDate(startDate);
    const parsedEnd = parseDate(endDate);

    if (parsedStart || parsedEnd) {
      query.date = {};
      if (parsedStart) {
        (query.date as Record<string, Date>).$gte = parsedStart;
      }
      if (parsedEnd) {
        (query.date as Record<string, Date>).$lte = parsedEnd;
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const existing = await Transaction.findOne({ _id: id, userId: req.userId });
    if (!existing) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    const nextValues = req.body as {
      type?: "income" | "expense";
      amount?: number;
      category?: string;
      date?: string;
      description?: string;
    };

    if (nextValues.category) {
      const validCategory = transactionCategories.includes(
        nextValues.category as (typeof transactionCategories)[number]
      );
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

    if (nextValues.type) existing.type = nextValues.type;
    if (nextValues.amount) existing.amount = nextValues.amount;
    if (nextValues.category) existing.category = nextValues.category;
    if (typeof nextValues.description === "string") existing.description = nextValues.description;

    await existing.save();
    res.status(200).json({ transaction: existing });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deleted) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    res.status(200).json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const dashboardSummary = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const query: Record<string, unknown> = { userId: req.userId };

    const parsedStart = parseDate(startDate);
    const parsedEnd = parseDate(endDate);

    if (parsedStart || parsedEnd) {
      query.date = {};
      if (parsedStart) {
        (query.date as Record<string, Date>).$gte = parsedStart;
      }
      if (parsedEnd) {
        (query.date as Record<string, Date>).$lte = parsedEnd;
      }
    }

    const transactions = (await Transaction.find(query)) as Array<{
      type: "income" | "expense";
      amount: number;
      category: string;
    }>;

    const totalIncome = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum: number, transaction) => sum + transaction.amount, 0);
    const totalExpense = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum: number, transaction) => sum + transaction.amount, 0);

    const byCategory = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce<Record<string, number>>((acc: Record<string, number>, transaction) => {
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
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
