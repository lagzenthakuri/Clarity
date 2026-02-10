import { motion } from "framer-motion";
import { DashboardIntelligence } from "../types";

type SpendingIntelligenceProps = {
  intelligence: DashboardIntelligence | null;
  spendingVelocity: number;
  velocityDays: number;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const SpendingIntelligence = ({
  intelligence,
  spendingVelocity,
  velocityDays,
}: SpendingIntelligenceProps) => {
  if (!intelligence) {
    return (
      <section className="card flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3 text-dark-200">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xs font-semibold uppercase tracking-widest">Neural Analysis In Progress...</p>
        </div>
      </section>
    );
  }

  const maxValue = Math.max(
    1,
    ...intelligence.monthlyTrend.flatMap((item) => [item.income, item.expense])
  );

  return (
    <section className="card flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
          </svg>
          Spending Intelligence
        </h2>
        <p className="text-dark-200 text-xs leading-relaxed max-w-2xl">{intelligence.explainSummary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-xl bg-dark-900/40 border border-dark-200/5 flex flex-col justify-between group hover:border-primary/20 transition-all">
          <div className="space-y-0.5">
            <p className="text-[10px] text-dark-200 uppercase tracking-[0.15em] font-bold">Confidence</p>
            <strong className="text-xl font-bold text-primary">{intelligence.confidenceScore}%</strong>
          </div>
          <div className="mt-3 h-1 w-full bg-dark-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${intelligence.confidenceScore}%` }}
              className="h-full bg-primary rounded-full transition-all"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-dark-900/40 border border-dark-200/5 flex flex-col justify-between group hover:border-rose-500/20 transition-all">
          <div className="space-y-0.5">
            <p className="text-[10px] text-dark-200 uppercase tracking-[0.15em] font-bold">Daily Burn</p>
            <strong className="text-xl font-bold text-rose-400">{currency.format(spendingVelocity)}</strong>
          </div>
          <p className="text-[9px] text-dark-200/50 italic mt-2">Historical {velocityDays}d avg</p>
        </div>

        <div className="p-3.5 rounded-xl bg-dark-900/40 border border-dark-200/5 group hover:border-secondary/20 transition-all">
          <p className="text-[10px] text-dark-200 uppercase tracking-[0.15em] font-bold mb-2">Key Insights</p>
          <ul className="space-y-1.5">
            {intelligence.confidenceNotes.slice(0, 2).map((note) => (
              <li key={note} className="flex gap-2 text-[11px] text-dark-100 leading-tight">
                <span className="text-primary font-bold">/</span> {note}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-dark-200 uppercase tracking-[0.2em] px-1 px-1">Trend Analysis</h3>
          <div className="h-[140px] flex items-end justify-between gap-1.5 px-1 pb-1">
            {intelligence.monthlyTrend.map((item) => (
              <div className="flex-1 flex flex-col items-center gap-2 h-full group" key={item.month}>
                <div className="flex-grow w-full flex items-end justify-center gap-0.5 min-h-0">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.income / maxValue) * 100}%` }}
                    className="w-full max-w-[8px] bg-primary/70 rounded-t-[1px] group-hover:bg-primary transition-colors"
                    title={`Income ${currency.format(item.income)}`}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.expense / maxValue) * 100}%` }}
                    className="w-full max-w-[8px] bg-rose-500/70 rounded-t-[1px] group-hover:bg-rose-400 transition-colors"
                    title={`Expense ${currency.format(item.expense)}`}
                  />
                </div>
                <span className="text-[9px] text-dark-200 font-bold uppercase tracking-tighter truncate w-full text-center">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-dark-200 uppercase tracking-[0.2em] px-1">Health Signals</h3>
          {intelligence.categoryHealth.length === 0 ? (
            <div className="flex items-center justify-center border border-dark-200/5 rounded-xl p-6 bg-dark-900/20">
              <p className="text-[10px] text-dark-200/50 uppercase tracking-widest italic">Monitoring Categories...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {intelligence.categoryHealth.slice(0, 6).map((item) => (
                <div key={item.category} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-900/30 border border-dark-200/5 hover:bg-dark-900/50 transition-colors">
                  <span className="text-xs font-medium text-dark-100 capitalize truncate pr-2">{item.category}</span>
                  <div className={`h-1.5 w-1.5 rounded-full ${item.status === 'green' ? 'bg-success' :
                    item.status === 'yellow' ? 'bg-warning' :
                      'bg-danger'
                    }`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SpendingIntelligence;

