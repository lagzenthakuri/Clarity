import { FormEvent, useEffect, useMemo, useState } from "react";
import { BudgetPeriod, BudgetStatus } from "../types";

type BudgetPanelProps = {
  budget: BudgetStatus | null;
  onSave: (payload: { amount: number; period: BudgetPeriod }) => Promise<void>;
  onClear: () => Promise<void>;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const periodLabel: Record<BudgetPeriod, string> = {
  now: "For Now",
  week: "This Week",
  month: "This Month",
};

const BudgetPanel = ({ budget, onSave, onClear }: BudgetPanelProps) => {
  const [amount, setAmount] = useState<string>(budget ? String(budget.amount) : "");
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? "month");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!budget) return;
    setAmount(String(budget.amount));
    setPeriod(budget.period);
  }, [budget]);

  const utilization = useMemo(
    () => (budget ? Math.min(Math.max(budget.utilizationPct, 0), 100) : 0),
    [budget]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return;

    setSaving(true);
    try {
      await onSave({ amount: parsed, period });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 9v1m-7-5a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
          Budget Tracker
        </h2>
        {budget ? (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
            {periodLabel[budget.period]}
          </span>
        ) : null}
      </div>

      <form className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">
            Amount
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input-field py-2 text-xs"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="1000"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">
            Period
          </label>
          <select
            className="input-field appearance-none py-2 text-xs"
            value={period}
            onChange={(event) => setPeriod(event.target.value as BudgetPeriod)}
          >
            <option value="now">For Now</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <button type="submit" className="btn-primary !py-2" disabled={saving}>
          {saving ? "Saving..." : budget ? "Update Budget" : "Set Budget"}
        </button>
      </form>

      {budget ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-dark-900/35 border border-dark-200/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-dark-200">Budget</p>
              <p className="text-base font-bold text-secondary">{currency.format(budget.amount)}</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/35 border border-dark-200/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-dark-200">Spent</p>
              <p className="text-base font-bold text-rose-400">{currency.format(budget.spent)}</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/35 border border-dark-200/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-dark-200">Remaining</p>
              <p className={`text-base font-bold ${budget.remaining < 0 ? "text-danger" : "text-primary"}`}>
                {currency.format(budget.remaining)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-dark-200">
              <span>Usage</span>
              <span>{Math.round(budget.utilizationPct)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-dark-900/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${budget.utilizationPct > 100 ? "bg-danger" : "bg-gradient-to-r from-primary to-secondary"}`}
                style={{ width: `${utilization}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost text-xs"
            disabled={clearing}
            onClick={async () => {
              setClearing(true);
              try {
                await onClear();
                setAmount("");
              } finally {
                setClearing(false);
              }
            }}
          >
            {clearing ? "Clearing..." : "Clear Budget"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-dark-200/70">
          Set a budget for your current money, this week, or this month to track how much you have left.
        </p>
      )}
    </section>
  );
};

export default BudgetPanel;
