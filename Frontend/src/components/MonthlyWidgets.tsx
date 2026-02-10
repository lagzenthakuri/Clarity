import { DashboardSummary } from "../types";

type MonthlyWidgetsProps = {
  summary: DashboardSummary;
};

const currency = new Intl.NumberFormat("en-NP", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: number): string => `Nrs ${currency.format(value)}`;

const MonthlyWidgets = ({ summary }: MonthlyWidgetsProps) => {
  const topCategories = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          Monthly Snapshot
        </h2>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary/10 text-secondary rounded-full border border-secondary/20 uppercase tracking-wider">
          Current Month
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-dark-900/40 border border-dark-200/10 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <p className="text-[10px] text-dark-200 uppercase tracking-widest mb-1 font-bold">Income</p>
          <strong className="text-xl font-bold text-primary tracking-tight">{formatCurrency(summary.totalIncome)}</strong>
        </div>

        <div className="p-4 rounded-xl bg-dark-900/40 border border-dark-200/10 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <p className="text-[10px] text-dark-200 uppercase tracking-widest mb-1 font-bold">Expenses</p>
          <strong className="text-xl font-bold text-rose-400 tracking-tight">{formatCurrency(summary.totalExpense)}</strong>
        </div>

        <div className="p-4 rounded-xl bg-dark-900/40 border border-dark-200/10 relative overflow-hidden group hover:border-secondary/30 transition-colors">
          <p className="text-[10px] text-dark-200 uppercase tracking-widest mb-1 font-bold">Net Balance</p>
          <strong className="text-xl font-bold text-secondary tracking-tight">{formatCurrency(summary.balance)}</strong>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-[10px] font-bold text-dark-200 uppercase tracking-[0.15em] mb-3">Top Categories</h3>
        {topCategories.length === 0 ? (
          <p className="text-xs text-dark-200/50 italic">No expense data this month.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {topCategories.map(([category, amount]) => (
              <div key={category} className="flex flex-col p-2.5 rounded-lg bg-dark-900/30 border border-dark-200/5 group hover:border-dark-200/20 transition-all">
                <span className="text-[10px] text-dark-200 uppercase font-medium tracking-wide mb-0.5">{category}</span>
                <span className="text-sm font-bold text-dark-100 group-hover:text-primary transition-colors">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MonthlyWidgets;
