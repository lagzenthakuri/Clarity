import { useEffect, useMemo, useState } from "react";
import api from "../api";
import DailyPresetManager from "../components/DailyPresetManager";
import MonthlyWidgets from "../components/MonthlyWidgets";
import SpendingIntelligence from "../components/SpendingIntelligence";
import SummaryCards from "../components/SummaryCards";
import TransactionFiltersPanel from "../components/TransactionFilters";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import { useAuth } from "../context/AuthContext";
import {
  DailyMoneyAdvice,
  DailyPreset,
  DashboardIntelligence,
  DashboardSummary,
  Transaction,
  TransactionFilters,
} from "../types";

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
const today = new Date().toISOString().slice(0, 10);
const msInDay = 24 * 60 * 60 * 1000;

type PendingDelete = {
  id: string;
  transaction: Transaction;
  timeoutId: number;
};

const getMonthDateRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const saved = sessionStorage.getItem("clarity_filters");
    return saved ? (JSON.parse(saved) as TransactionFilters) : defaultFilters;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [presets, setPresets] = useState<DailyPreset[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [monthlySummary, setMonthlySummary] = useState<DashboardSummary>(defaultSummary);
  const [intelligence, setIntelligence] = useState<DashboardIntelligence | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiDate, setAiDate] = useState<string>(today);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiAdvice, setAiAdvice] = useState<DailyMoneyAdvice | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<PendingDelete[]>([]);

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
      const { startDate, endDate } = getMonthDateRange();
      const monthQuery = new URLSearchParams({ startDate, endDate }).toString();

      const [
        transactionsResponse,
        summaryResponse,
        presetsResponse,
        monthlySummaryResponse,
        intelligenceResponse,
      ] =
        await Promise.all([
          api.get<{ transactions: Transaction[] }>(`/transactions?${query}`),
          api.get<{ summary: DashboardSummary }>(`/transactions/dashboard?${query}`),
          api.get<{ presets: DailyPreset[] }>("/daily-presets"),
          api.get<{ summary: DashboardSummary }>(`/transactions/dashboard?${monthQuery}`),
          api.get<{ intelligence: DashboardIntelligence }>("/insights/dashboard-intelligence"),
        ]);

      setTransactions(transactionsResponse.data.transactions);
      setSummary(summaryResponse.data.summary);
      setPresets(presetsResponse.data.presets);
      setMonthlySummary(monthlySummaryResponse.data.summary);
      setIntelligence(intelligenceResponse.data.intelligence);
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
    const transaction = transactions.find((item) => item._id === id);
    if (!transaction) return;

    setTransactions((prev) => prev.filter((item) => item._id !== id));

    const timeoutId = window.setTimeout(async () => {
      try {
        await api.delete(`/transactions/${id}`);
      } finally {
        setPendingDeletes((prev) => prev.filter((item) => item.id !== id));
        await loadData();
      }
    }, 10_000);

    setPendingDeletes((prev) => [...prev, { id, transaction, timeoutId }]);
  };

  const undoDelete = (id: string): void => {
    const pending = pendingDeletes.find((item) => item.id === id);
    if (!pending) return;

    window.clearTimeout(pending.timeoutId);
    setPendingDeletes((prev) => prev.filter((item) => item.id !== id));
    setTransactions((prev) =>
      [...prev, pending.transaction].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
  };

  const handleCreatePreset = async (payload: {
    name: string;
    type: "income" | "expense";
    amount: number;
    category: string;
    description: string;
    active: boolean;
  }): Promise<void> => {
    await api.post("/daily-presets", payload);
    await loadData();
  };

  const handleUpdatePreset = async (
    id: string,
    payload: Partial<{
      name: string;
      type: "income" | "expense";
      amount: number;
      category: string;
      description: string;
      active: boolean;
    }>
  ): Promise<void> => {
    await api.put(`/daily-presets/${id}`, payload);
    await loadData();
  };

  const handleDeletePreset = async (id: string): Promise<void> => {
    await api.delete(`/daily-presets/${id}`);
    await loadData();
  };

  const handleApplyPreset = async (id: string): Promise<void> => {
    const today = new Date().toISOString().slice(0, 10);
    await api.post(`/daily-presets/${id}/apply`, { date: today });
    await loadData();
  };

  const handleGenerateAiSummary = async (): Promise<void> => {
    setAiLoading(true);
    setAiError("");
    try {
      const response = await api.post<{ advice: DailyMoneyAdvice }>("/insights/daily-summary", {
        date: aiDate,
      });
      setAiAdvice(response.data.advice);
    } catch {
      setAiError("Unable to generate summary right now. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const spendingVelocity = useMemo(() => {
    const totalExpense = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    const dates = transactions.map((item) => new Date(item.date).getTime()).filter(Boolean);
    let dayWindow = 1;
    if (dates.length > 0) {
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      dayWindow = Math.max(1, Math.floor((maxDate - minDate) / msInDay) + 1);
    }

    return { value: totalExpense / dayWindow, days: dayWindow };
  }, [transactions]);

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

      <MonthlyWidgets summary={monthlySummary} />

      <section className="grid grid-2">
        <SummaryCards summary={summary} />
        <TransactionForm
          onSubmit={handleSaveTransaction}
          editingTransaction={editingTransaction}
          onCancelEdit={() => setEditingTransaction(null)}
        />
      </section>

      <DailyPresetManager
        presets={presets}
        onCreate={handleCreatePreset}
        onUpdate={handleUpdatePreset}
        onDelete={handleDeletePreset}
        onApply={handleApplyPreset}
      />

      <SpendingIntelligence
        intelligence={intelligence}
        spendingVelocity={spendingVelocity.value}
        velocityDays={spendingVelocity.days}
      />

      <section className="card form-grid">
        <h2>AI Daily Money Summary</h2>
        <div className="split">
          <label>
            Date
            <input type="date" value={aiDate} onChange={(event) => setAiDate(event.target.value)} />
          </label>
          <div className="ai-actions">
            <button type="button" onClick={() => void handleGenerateAiSummary()} disabled={aiLoading}>
              {aiLoading ? "Generating..." : "Give summary"}
            </button>
          </div>
        </div>
        {aiError && <p className="error">{aiError}</p>}
        {aiAdvice && (
          <div className="ai-summary">
            <p>
              <strong>Money flow:</strong> Income ${aiAdvice.income.toFixed(2)} | Expense $
              {aiAdvice.expense.toFixed(2)} | Balance ${aiAdvice.balance.toFixed(2)}
            </p>
            <p>{aiAdvice.briefSummary}</p>
            <div className="split">
              <div>
                <h3>What to do</h3>
                {aiAdvice.doList.length === 0 ? (
                  <p className="muted">No specific recommendations.</p>
                ) : (
                  <ul className="advice-list">
                    {aiAdvice.doList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3>What not to do</h3>
                {aiAdvice.avoidList.length === 0 ? (
                  <p className="muted">No risk signals today.</p>
                ) : (
                  <ul className="advice-list">
                    {aiAdvice.avoidList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {aiAdvice.source === "fallback" && (
              <p className="muted">
                AI fallback mode: set OPENROUTER_API_KEY in backend to get model-generated advice.
              </p>
            )}
          </div>
        )}
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

      {pendingDeletes.length > 0 && (
        <section className="undo-stack">
          {pendingDeletes.map((item) => (
            <div key={item.id} className="undo-toast">
              <span>Transaction deleted.</span>
              <button className="ghost" onClick={() => undoDelete(item.id)}>
                Undo
              </button>
            </div>
          ))}
        </section>
      )}
    </main>
  );
};

export default DashboardPage;
