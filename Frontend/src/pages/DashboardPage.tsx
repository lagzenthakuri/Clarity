import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import api from "../api";
import DailyPresetManager from "../components/DailyPresetManager";
import MonthlyWidgets from "../components/MonthlyWidgets";
import BudgetPanel from "../components/BudgetPanel";
import SpendingIntelligence from "../components/SpendingIntelligence";
import SummaryCards from "../components/SummaryCards";
import TransactionFiltersPanel from "../components/TransactionFilters";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import ThemeToggle from "../components/ThemeToggle";
import Modal from "../components/Modal";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  DailyMoneyAdvice,
  DailyPreset,
  DashboardIntelligence,
  DashboardSummary,
  BudgetPeriod,
  BudgetStatus,
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const handleLogout = (): void => {
    logout();
    showSuccessToast("Signed out successfully.");
  };
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const saved = sessionStorage.getItem("clarity_filters");
    return saved ? (JSON.parse(saved) as TransactionFilters) : defaultFilters;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [presets, setPresets] = useState<DailyPreset[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [monthlySummary, setMonthlySummary] = useState<DashboardSummary>(defaultSummary);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [intelligence, setIntelligence] = useState<DashboardIntelligence | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
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

  const loadData = async (
    isInitial = false,
    options?: { silentError?: boolean }
  ): Promise<void> => {
    const silentError = options?.silentError ?? false;
    if (isInitial) setLoading(true);
    else setDataLoading(true);

    try {
      const { startDate, endDate } = getMonthDateRange();
      const monthQuery = new URLSearchParams({ startDate, endDate }).toString();

      const [
        transactionsResponse,
        summaryResponse,
        presetsResponse,
        budgetResponse,
        monthlySummaryResponse,
        intelligenceResponse,
      ] =
        await Promise.all([
          api.get<{ transactions: Transaction[] }>(`/transactions?${query}`),
          api.get<{ summary: DashboardSummary }>(`/transactions/dashboard?${query}`),
          api.get<{ presets: DailyPreset[] }>("/daily-presets"),
          api.get<{ budget: BudgetStatus | null }>("/budgets/current"),
          api.get<{ summary: DashboardSummary }>(`/transactions/dashboard?${monthQuery}`),
          api.get<{ intelligence: DashboardIntelligence }>("/insights/dashboard-intelligence"),
        ]);

      setTransactions(transactionsResponse.data.transactions);
      setSummary(summaryResponse.data.summary);
      setPresets(presetsResponse.data.presets);
      setBudget(budgetResponse.data.budget);
      setMonthlySummary(monthlySummaryResponse.data.summary);
      setIntelligence(intelligenceResponse.data.intelligence);
      sessionStorage.setItem("clarity_filters", JSON.stringify(filters));
    } catch {
      if (!silentError) {
        showErrorToast("Failed to load dashboard data.");
      }
      throw new Error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  useEffect(() => {
    void loadData(transactions.length === 0).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSaveTransaction = async (payload: {
    type: "income" | "expense";
    amount: number;
    category: string;
    date: string;
    description: string;
  }): Promise<void> => {
    try {
      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction._id}`, payload);
        setEditingTransaction(null);
        showSuccessToast(
          payload.type === "expense"
            ? "Expense updated successfully."
            : "Income updated successfully."
        );
      } else {
        await api.post("/transactions", payload);
        showSuccessToast(
          payload.type === "expense"
            ? "Expense added successfully."
            : "Income added successfully."
        );
      }
      await loadData(false, { silentError: true });
    } catch {
      showErrorToast(
        payload.type === "expense"
          ? "Failed to save expense."
          : "Failed to save income."
      );
      throw new Error("Failed to save transaction.");
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    const transaction = transactions.find((item) => item._id === id);
    if (!transaction) return;

    try {
      setTransactions((prev) => prev.filter((item) => item._id !== id));

      const timeoutId = window.setTimeout(async () => {
        try {
          await api.delete(`/transactions/${id}`);
          showSuccessToast("Transaction deleted successfully.");
        } catch {
          showErrorToast("Failed to delete transaction.");
          setTransactions((prev) =>
            [...prev, transaction].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
          );
        } finally {
          setPendingDeletes((prev) => prev.filter((item) => item.id !== id));
          await loadData(false, { silentError: true }).catch(() => undefined);
        }
      }, 10_000);

      setPendingDeletes((prev) => [...prev, { id, transaction, timeoutId }]);
      showSuccessToast("Transaction removed. You can undo within 10 seconds.");
    } catch {
      showErrorToast("Failed to remove transaction.");
    }
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
    showSuccessToast("Delete undone successfully.");
  };

  const handleCreatePreset = async (payload: {
    name: string;
    type: "income" | "expense";
    amount: number;
    category: string;
    description: string;
    active: boolean;
  }): Promise<void> => {
    try {
      await api.post("/daily-presets", payload);
      await loadData(false, { silentError: true });
      showSuccessToast("Quick action created successfully.");
    } catch {
      showErrorToast("Failed to create quick action.");
      throw new Error("Failed to create quick action.");
    }
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
    try {
      await api.put(`/daily-presets/${id}`, payload);
      await loadData(false, { silentError: true });
      showSuccessToast("Quick action updated successfully.");
    } catch {
      showErrorToast("Failed to update quick action.");
      throw new Error("Failed to update quick action.");
    }
  };

  const handleDeletePreset = async (id: string): Promise<void> => {
    try {
      await api.delete(`/daily-presets/${id}`);
      await loadData(false, { silentError: true });
      showSuccessToast("Quick action deleted successfully.");
    } catch {
      showErrorToast("Failed to delete quick action.");
    }
  };

  const handleApplyPreset = async (id: string): Promise<void> => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await api.post(`/daily-presets/${id}/apply`, { date: today });
      await loadData(false, { silentError: true });
      showSuccessToast("Quick action applied successfully.");
    } catch {
      showErrorToast("Failed to apply quick action.");
    }
  };

  const handleGenerateAiSummary = async (): Promise<void> => {
    setAiLoading(true);
    setAiError("");
    try {
      const response = await api.post<{ advice: DailyMoneyAdvice }>("/insights/daily-summary", {
        date: aiDate,
      });
      setAiAdvice(response.data.advice);
      showSuccessToast("AI summary generated successfully.");
    } catch {
      setAiError("Unable to generate summary right now. Please try again.");
      showErrorToast("Failed to generate AI summary.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveBudget = async (payload: {
    amount: number;
    period: BudgetPeriod;
  }): Promise<void> => {
    try {
      await api.post("/budgets/current", payload);
      await loadData(false, { silentError: true });
      showSuccessToast("Budget saved successfully.");
    } catch {
      showErrorToast("Failed to save budget.");
      throw new Error("Failed to save budget.");
    }
  };

  const handleClearBudget = async (): Promise<void> => {
    try {
      await api.delete("/budgets/current");
      await loadData(false, { silentError: true });
      showSuccessToast("Budget cleared successfully.");
    } catch {
      showErrorToast("Failed to clear budget.");
      throw new Error("Failed to clear budget.");
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

  if (loading) return <LoadingScreen message="Analyzing your financial clarity..." />;

  return (
    <motion.main
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5"
    >
      <motion.header variants={itemVariants} className="card flex items-center justify-between py-2.5 px-4 mb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Clarity</h1>
            <p className="text-xs text-dark-200">Welcome, <span className="text-dark-100 font-semibold">{user?.name}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button
            className="btn-primary flex items-center gap-1.5 !px-3 !py-1.5"
            onClick={() => setIsTransactionModalOpen(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </button>
          <button
            className="btn-ghost !px-3 !py-1.5 text-[10px] uppercase tracking-wider"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </motion.header>

      <motion.div variants={itemVariants}>
        <MonthlyWidgets summary={monthlySummary} />
      </motion.div>

      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <SummaryCards summary={summary} />
        <BudgetPanel budget={budget} onSave={handleSaveBudget} onClear={handleClearBudget} />
      </motion.section>

      <Modal
        isOpen={isTransactionModalOpen || Boolean(editingTransaction)}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? "Update Expense" : "New Expense"}
      >
        <TransactionForm
          onSubmit={async (data) => {
            try {
              await handleSaveTransaction(data);
              setIsTransactionModalOpen(false);
            } catch {
              // Toast is already shown in handleSaveTransaction.
            }
          }}
          editingTransaction={editingTransaction}
          onCancelEdit={() => {
            setEditingTransaction(null);
            setIsTransactionModalOpen(false);
          }}
        />
      </Modal>

      <motion.div variants={itemVariants}>
        <DailyPresetManager
          presets={presets}
          onCreate={handleCreatePreset}
          onUpdate={handleUpdatePreset}
          onDelete={handleDeletePreset}
          onApply={handleApplyPreset}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <SpendingIntelligence
          intelligence={intelligence}
          spendingVelocity={spendingVelocity.value}
          velocityDays={spendingVelocity.days}
        />
      </motion.div>

      <motion.section variants={itemVariants} className="card flex flex-col gap-4 overflow-hidden relative">
        {aiLoading && (
          <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full"
              />
              <p className="text-xs text-primary font-bold animate-pulse uppercase tracking-wider">Analyzing...</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
              <span className="text-primary">✨</span> AI Daily Summary
            </h2>
            <p className="text-xs text-dark-200">Get AI-generated insights for any specific date.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input-field !py-1.5 text-xs"
              value={aiDate}
              onChange={(event) => setAiDate(event.target.value)}
            />
            <button
              type="button"
              className="btn-primary !px-3 !py-1.5 text-[10px] uppercase tracking-widest whitespace-nowrap"
              onClick={() => void handleGenerateAiSummary()}
              disabled={aiLoading}
            >
              Generate
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {aiError && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-danger text-xs font-medium bg-danger/10 p-4 rounded-xl border border-danger/20"
            >
              {aiError}
            </motion.p>
          )}

          {aiAdvice && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-dark-900/40 rounded-xl p-5 border border-dark-200/5 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-dark-200/10 pb-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-dark-200 uppercase tracking-widest font-bold">Planned Income</p>
                  <p className="text-base font-bold text-primary">Nrs {aiAdvice.income.toFixed(2)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-dark-200 uppercase tracking-widest font-bold">Projected Loss</p>
                  <p className="text-base font-bold text-rose-400">Nrs {aiAdvice.expense.toFixed(2)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-dark-200 uppercase tracking-widest font-bold">Net Standing</p>
                  <p className="text-base font-bold text-secondary">Nrs {aiAdvice.balance.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-dark-100 italic">" {aiAdvice.briefSummary} "</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Strategic Actions
                  </h4>
                  {aiAdvice.doList.length === 0 ? (
                    <p className="text-[11px] text-dark-200/50 italic">No specific signals for this date.</p>
                  ) : (
                    <ul className="space-y-1.5 px-0.5">
                      {aiAdvice.doList.map((item) => (
                        <li key={item} className="text-[11px] text-dark-100/80 flex gap-2 leading-snug">
                          <span className="text-primary font-bold shrink-0">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Risks to Mitigate
                  </h4>
                  {aiAdvice.avoidList.length === 0 ? (
                    <p className="text-[11px] text-dark-200/50 italic">Operational stability nominal.</p>
                  ) : (
                    <ul className="space-y-1.5 px-0.5">
                      {aiAdvice.avoidList.map((item) => (
                        <li key={item} className="text-[11px] text-dark-100/80 flex gap-2 leading-snug">
                          <span className="text-rose-500 font-bold shrink-0">!</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {aiAdvice.source === "fallback" && (
                <div className="pt-3 border-t border-dark-200/5 flex justify-center">
                  <span className="text-[9px] text-dark-200/20 uppercase tracking-[0.2em]">Neural Engine Offline</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.div variants={itemVariants}>
        <TransactionFiltersPanel
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultFilters)}
        />
      </motion.div>

      <motion.section variants={itemVariants} className="relative min-h-[400px]">
        {dataLoading && (
          <div className="absolute inset-0 bg-dark-900/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 w-24 bg-teal-500/50 rounded-full"
            />
          </div>
        )}
        <TransactionTable
          transactions={transactions}
          onEdit={(transaction) => setEditingTransaction(transaction)}
          onDelete={handleDelete}
        />
      </motion.section>

      <AnimatePresence>
        {pendingDeletes.length > 0 && (
          <section className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            {pendingDeletes.map((item) => (
              <motion.div
                key={item.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="bg-dark-900 border border-dark-200/20 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-4"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-sm text-dark-100 font-medium">Transaction deleted</span>
                <button
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-widest pl-4 border-l border-dark-200/20"
                  onClick={() => undoDelete(item.id)}
                >
                  Undo
                </button>
              </motion.div>
            ))}
          </section>
        )}
      </AnimatePresence>
    </motion.main>
  );
};

export default DashboardPage;
