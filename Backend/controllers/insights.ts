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

type MonthPoint = {
  month: string;
  income: number;
  expense: number;
  byCategory: Record<string, number>;
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

const monthKeyUtc = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const monthShortLabel = (key: string): string => {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
};

const getMonthStarts = (count: number): Date[] => {
  const now = new Date();
  const starts: Date[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    starts.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)));
  }
  return starts;
};

const asDateOnlyUtc = (date: Date): string => date.toISOString().slice(0, 10);

const getCurrentMonthMeta = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const daysElapsed = now.getUTCDate();
  return { start, end, daysElapsed };
};

const buildExplainSummary = (current: MonthPoint, previous: MonthPoint): string => {
  const currentTop = Object.entries(current.byCategory).sort((a, b) => b[1] - a[1])[0];
  const previousTop = Object.entries(previous.byCategory).sort((a, b) => b[1] - a[1])[0];

  if (!currentTop && !previousTop) {
    return "You have no expense activity in the current and previous month yet.";
  }

  const category = currentTop?.[0] || previousTop?.[0] || "Other";
  const currentValue = current.byCategory[category] || 0;
  const previousValue = previous.byCategory[category] || 0;
  const diff = currentValue - previousValue;
  const pct =
    previousValue > 0
      ? Math.round((Math.abs(diff) / previousValue) * 100)
      : currentValue > 0
        ? 100
        : 0;
  const direction = diff >= 0 ? "more" : "less";

  const sentenceOne =
    previousValue === 0
      ? `You started spending in ${category} this month with ${currentValue.toFixed(2)}.`
      : `You spent ${pct}% ${direction} on ${category} this month compared to last month.`;
  const sentenceTwo =
    current.expense > previous.expense
      ? `Overall expenses increased from ${previous.expense.toFixed(2)} to ${current.expense.toFixed(2)}.`
      : `Overall expenses improved from ${previous.expense.toFixed(2)} to ${current.expense.toFixed(2)}.`;
  const sentenceThree =
    current.income - current.expense >= 0
      ? "You are currently operating with a positive monthly balance."
      : "Current month balance is negative, so cost control should be the immediate priority.";

  return `${sentenceOne} ${sentenceTwo} ${sentenceThree}`;
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

export const dashboardIntelligence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const monthStarts = getMonthStarts(6);
    const firstStart = monthStarts[0];
    const endBoundary = new Date(monthStarts[monthStarts.length - 1]);
    endBoundary.setUTCMonth(endBoundary.getUTCMonth() + 1);

    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: firstStart, $lt: endBoundary },
    }).select("type amount category date description");

    const monthMap = new Map<string, MonthPoint>();
    for (const start of monthStarts) {
      const key = monthKeyUtc(start);
      monthMap.set(key, { month: key, income: 0, expense: 0, byCategory: {} });
    }

    for (const item of transactions) {
      const key = monthKeyUtc(new Date(item.date));
      const bucket = monthMap.get(key);
      if (!bucket) continue;

      if (item.type === "income") {
        bucket.income += item.amount;
      } else {
        bucket.expense += item.amount;
        bucket.byCategory[item.category] = (bucket.byCategory[item.category] || 0) + item.amount;
      }
    }

    const monthSeries = monthStarts.map((start) => monthMap.get(monthKeyUtc(start)) as MonthPoint);
    const currentMonth = monthSeries[monthSeries.length - 1];
    const previousMonth = monthSeries[monthSeries.length - 2];

    const explainSummary = buildExplainSummary(currentMonth, previousMonth);

    const currentMonthMeta = getCurrentMonthMeta();
    const currentMonthTransactions = transactions.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= currentMonthMeta.start && itemDate < currentMonthMeta.end;
    });
    const loggedDays = new Set(currentMonthTransactions.map((item) => asDateOnlyUtc(new Date(item.date))));
    const loggingRate = currentMonthMeta.daysElapsed
      ? loggedDays.size / currentMonthMeta.daysElapsed
      : 0;
    const descriptionRate =
      currentMonthTransactions.length > 0
        ? currentMonthTransactions.filter((item) => Boolean((item.description || "").trim())).length /
          currentMonthTransactions.length
        : 0;
    const currentExpenseTotal = currentMonth.expense;
    const otherExpense = currentMonth.byCategory.Other || 0;
    const categorizationQuality =
      currentExpenseTotal > 0 ? Math.max(0, 1 - otherExpense / currentExpenseTotal) : 1;

    const confidenceScore = Math.round(
      (loggingRate * 0.5 + descriptionRate * 0.3 + categorizationQuality * 0.2) * 100
    );
    const confidenceNotes = [
      `${loggedDays.size}/${currentMonthMeta.daysElapsed} days logged this month`,
      `${Math.round(descriptionRate * 100)}% transactions have descriptions`,
      `${Math.round(categorizationQuality * 100)}% categorization quality`,
    ];

    const categories = new Set<string>();
    monthSeries.forEach((month) => Object.keys(month.byCategory).forEach((category) => categories.add(category)));

    const trailing3 = monthSeries.slice(-4, -1);
    const categoryHealth = Array.from(categories)
      .map((category) => {
        const trailingAvg =
          trailing3.reduce((sum, month) => sum + (month.byCategory[category] || 0), 0) /
          Math.max(trailing3.length, 1);
        const current = currentMonth.byCategory[category] || 0;
        const ratio = trailingAvg > 0 ? current / trailingAvg : current > 0 ? 2 : 1;
        const status = ratio > 1.4 ? "red" : ratio > 1.1 ? "yellow" : "green";
        return { category, current, trailingAvg, status };
      })
      .filter((item) => item.current > 0 || item.trailingAvg > 0)
      .sort((a, b) => b.current - a.current)
      .slice(0, 6);

    res.status(200).json({
      intelligence: {
        explainSummary,
        confidenceScore,
        confidenceNotes,
        monthlyTrend: monthSeries.map((month) => ({
          month: monthShortLabel(month.month),
          income: month.income,
          expense: month.expense,
        })),
        categoryHealth,
      },
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
