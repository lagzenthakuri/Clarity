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

export type TransactionFilters = {
  category: string;
  type: "" | TransactionType;
  startDate: string;
  endDate: string;
};
