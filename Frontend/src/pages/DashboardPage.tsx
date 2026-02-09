import { useEffect, useMemo, useState } from "react";
import api from "../api";
import SummaryCards from "../components/SummaryCards";
import TransactionFiltersPanel from "../components/TransactionFilters";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import { useAuth } from "../context/AuthContext";
import { DashboardSummary, Transaction, TransactionFilters } from "../types";

const defaultSummary: DashboardSummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  byCategory: {},
};

const defaultFilters: TransactionFilters = {
  category: "",
  type: "",
  startDate: "",
  endDate: "",
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const saved = sessionStorage.getItem("clarity_filters");
    return saved ? (JSON.parse(saved) as TransactionFilters) : defaultFilters;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.type) params.set("type", filters.type);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    return params.toString();
  }, [filters]);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [transactionsResponse, summaryResponse] = await Promise.all([
        api.get<{ transactions: Transaction[] }>(`/transactions?${query}`),
        api.get<{ summary: DashboardSummary }>(`/transactions/dashboard?${query}`),
      ]);

      setTransactions(transactionsResponse.data.transactions);
      setSummary(summaryResponse.data.summary);
      sessionStorage.setItem("clarity_filters", JSON.stringify(filters));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSaveTransaction = async (payload: {
    type: "income" | "expense";
    amount: number;
    category: string;
    date: string;
    description: string;
  }): Promise<void> => {
    if (editingTransaction) {
      await api.put(`/transactions/${editingTransaction._id}`, payload);
      setEditingTransaction(null);
    } else {
      await api.post("/transactions", payload);
    }
    await loadData();
  };

  const handleDelete = async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
    await loadData();
  };

  return (
    <main className="layout">
      <header className="topbar card">
        <div>
          <h1>Clarity</h1>
          <p>Welcome back, {user?.name}</p>
        </div>
        <button className="ghost" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="grid grid-2">
        <SummaryCards summary={summary} />
        <TransactionForm
          onSubmit={handleSaveTransaction}
          editingTransaction={editingTransaction}
          onCancelEdit={() => setEditingTransaction(null)}
        />
      </section>

      <TransactionFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {loading ? (
        <section className="card">
          <p>Loading data...</p>
        </section>
      ) : (
        <TransactionTable
          transactions={transactions}
          onEdit={(transaction) => setEditingTransaction(transaction)}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
};

export default DashboardPage;
