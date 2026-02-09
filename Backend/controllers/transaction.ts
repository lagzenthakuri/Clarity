import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import Transaction, { transactionCategories } from "../models/transaction";

type TransactionCategory = (typeof transactionCategories)[number];
type TransactionType = "income" | "expense";

const categoryKeywords: Record<TransactionCategory, string[]> = {
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

const parseDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const detectCategoryFromDescription = (description: string): {
  category: TransactionCategory;
  keyword: string;
} | null => {
  const normalized = description.toLowerCase();

  for (const category of transactionCategories) {
    for (const keyword of categoryKeywords[category]) {
      if (normalized.includes(keyword)) {
        return { category, keyword };
      }
    }
  }

  return null;
};

const decideCategoryAndReason = (args: {
  selectedCategory: TransactionCategory;
  description: string;
  type: TransactionType;
}): { category: TransactionCategory; reason: string } => {
  const { selectedCategory, description, type } = args;
  const detected = detectCategoryFromDescription(description);

  if (!detected) {
    return { category: selectedCategory, reason: "Selected manually" };
  }

  if (selectedCategory === "Other") {
    const allowedForType =
      type === "income"
        ? new Set<TransactionCategory>(["Salary", "Freelance", "Investment", "Other"])
        : new Set<TransactionCategory>(transactionCategories.filter((item) => item !== "Salary" && item !== "Freelance" && item !== "Investment"));

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

    const finalCategory = category as TransactionCategory;
    const { category: resolvedCategory, reason } = decideCategoryAndReason({
      selectedCategory: finalCategory,
      description: description || "",
      type,
    });

    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      amount,
      category: resolvedCategory,
      date: parsedDate,
      description: description || "",
      categorizationReason: reason,
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
    if (typeof nextValues.description === "string") existing.description = nextValues.description;

    if (nextValues.category || typeof nextValues.description === "string" || nextValues.type) {
      const selectedCategory = (nextValues.category
        ? nextValues.category
        : existing.category) as TransactionCategory;
      const { category: resolvedCategory, reason } = decideCategoryAndReason({
        selectedCategory,
        description: existing.description || "",
        type: existing.type as TransactionType,
      });
      existing.category = resolvedCategory;
      existing.categorizationReason = reason;
    }

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
