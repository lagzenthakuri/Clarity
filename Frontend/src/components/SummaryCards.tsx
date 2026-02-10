import { motion } from "framer-motion";
import { DashboardSummary } from "../types";

type SummaryCardsProps = {
  summary: DashboardSummary;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const sortedCategories = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Overview
        </h2>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
          Selected Period
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Income", value: summary.totalIncome, color: "text-primary" },
          { label: "Total Expense", value: summary.totalExpense, color: "text-rose-400" },
          { label: "Balance", value: summary.balance, color: "text-secondary" },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -2 }}
            className="p-3.5 rounded-xl bg-dark-900/50 border border-dark-200/5"
          >
            <p className="text-[10px] text-dark-200 uppercase tracking-widest mb-1 font-bold">{item.label}</p>
            <strong className={`text-base font-bold ${item.color}`}>
              {currency.format(item.value)}
            </strong>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-dark-200 uppercase tracking-[0.2em] px-1">Expense Distribution</h3>
        {sortedCategories.length === 0 ? (
          <p className="text-xs text-dark-200/50 italic py-4 text-center">No transactions found for this period.</p>
        ) : (
          <ul className="space-y-3 px-1">
            {sortedCategories.map(([category, value], idx) => {
              const ratio = summary.totalExpense ? (value / summary.totalExpense) * 100 : 0;
              return (
                <motion.li
                  key={category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="group"
                >
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-semibold text-dark-100 capitalize">{category}</span>
                    <span className="text-xs font-bold text-dark-200 group-hover:text-primary transition-colors">
                      {currency.format(value)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-dark-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ratio}%` }}
                      transition={{ duration: 1, delay: 0.4 + idx * 0.1, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-white/20 blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SummaryCards;

