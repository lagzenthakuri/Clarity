export type TransactionType = "income" | "expense";

export type User = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
};

export type Transaction = {
  _id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string;
  categorizationReason?: string;
};

export type DashboardSummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
};

export type DailyPreset = {
  _id: string;
  name: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  active: boolean;
};

export type DailyMoneyAdvice = {
  date: string;
  income: number;
  expense: number;
  balance: number;
  briefSummary: string;
  doList: string[];
  avoidList: string[];
  source: "ai" | "fallback";
};

export type MonthlyTrendPoint = {
  month: string;
  income: number;
  expense: number;
};

export type CategoryHealthItem = {
  category: string;
  current: number;
  trailingAvg: number;
  status: "green" | "yellow" | "red";
};

export type DashboardIntelligence = {
  explainSummary: string;
  confidenceScore: number;
  confidenceNotes: string[];
  monthlyTrend: MonthlyTrendPoint[];
  categoryHealth: CategoryHealthItem[];
};

export type TransactionFilters = {
  category: string;
  type: "" | TransactionType;
  startDate: string;
  endDate: string;
};

export type BudgetPeriod = "now" | "week" | "month";

export type BudgetStatus = {
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  spent: number;
  remaining: number;
  utilizationPct: number;
};
