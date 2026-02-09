import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import Transaction from "../models/transaction";

type AdviceResponse = {
  date: string;
  income: number;
  expense: number;
  balance: number;
  briefSummary: string;
  doList: string[];
  avoidList: string[];
  source: "ai" | "fallback";
};

const asDayRange = (dateString: string): { start: Date; end: Date } | null => {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const safeJsonParse = (value: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    const fenced = value.match(/```json\s*([\s\S]*?)```/i);
    if (!fenced?.[1]) return null;
    try {
      return JSON.parse(fenced[1]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
};

const fallbackAdvice = (args: {
  date: string;
  income: number;
  expense: number;
  balance: number;
  topCategories: Array<[string, number]>;
}): AdviceResponse => {
  const { date, income, expense, balance, topCategories } = args;
  const topCategoryText = topCategories[0]
    ? `${topCategories[0][0]} (${topCategories[0][1].toFixed(2)})`
    : "no dominant category";

  const briefSummary =
    balance >= 0
      ? `On ${date}, you stayed positive. Income was ${income.toFixed(2)} and expenses were ${expense.toFixed(2)}.`
      : `On ${date}, spending was higher than income by ${Math.abs(balance).toFixed(2)}.`;

  const doList = [
    "Keep tracking daily so patterns stay visible.",
    `Review ${topCategoryText} and set a small daily cap for tomorrow.`,
    balance >= 0 ? "Move some surplus into savings." : "Trim one non-essential spend tomorrow.",
  ];

  const avoidList = [
    "Avoid impulse purchases late in the day.",
    "Do not ignore recurring small expenses.",
    balance < 0 ? "Avoid new discretionary spending until balance improves." : "Avoid overconfidence spending.",
  ];

  return { date, income, expense, balance, briefSummary, doList, avoidList, source: "fallback" };
};

export const dailySummaryAdvice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const date = (req.body as { date?: string }).date || new Date().toISOString().slice(0, 10);
    const dayRange = asDayRange(date);
    if (!dayRange) {
      res.status(400).json({ message: "Invalid date. Expected YYYY-MM-DD." });
      return;
    }

    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: dayRange.start, $lt: dayRange.end },
    }).select("type amount category description");

    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const balance = income - expense;

    const expenseByCategory = transactions
      .filter((item) => item.type === "expense")
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {});

    const topCategories = Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      res.status(200).json({ advice: fallbackAdvice({ date, income, expense, balance, topCategories }) });
      return;
    }

    const promptPayload = {
      date,
      totals: { income, expense, balance },
      topExpenseCategories: topCategories.map(([category, amount]) => ({ category, amount })),
      transactions: transactions.map((item) => ({
        type: item.type,
        category: item.category,
        amount: item.amount,
        description: item.description || "",
      })),
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
        ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}),
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are a practical personal finance coach. Return ONLY valid JSON with keys: briefSummary (string), doList (array of max 4 strings), avoidList (array of max 4 strings). Keep advice specific to the given day.",
          },
          {
            role: "user",
            content: JSON.stringify(promptPayload),
          },
        ],
      }),
    });

    if (!response.ok) {
      res.status(200).json({ advice: fallbackAdvice({ date, income, expense, balance, topCategories }) });
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      res.status(200).json({ advice: fallbackAdvice({ date, income, expense, balance, topCategories }) });
      return;
    }

    const parsed = safeJsonParse(content);
    if (!parsed) {
      res.status(200).json({ advice: fallbackAdvice({ date, income, expense, balance, topCategories }) });
      return;
    }

    const advice: AdviceResponse = {
      date,
      income,
      expense,
      balance,
      briefSummary:
        typeof parsed.briefSummary === "string" && parsed.briefSummary.trim()
          ? parsed.briefSummary.trim()
          : `Income ${income.toFixed(2)}, expense ${expense.toFixed(2)} on ${date}.`,
      doList: toStringList(parsed.doList),
      avoidList: toStringList(parsed.avoidList),
      source: "ai",
    };

    res.status(200).json({ advice });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
