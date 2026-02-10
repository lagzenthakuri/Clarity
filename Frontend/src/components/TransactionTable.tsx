import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "../types";

type TransactionTableProps = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const TransactionTable = ({ transactions, onEdit, onDelete }: TransactionTableProps) => {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2">
        <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </h2>
        <motion.span
          key={transactions.length}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[10px] font-bold text-dark-200 bg-dark-900/50 px-2 py-0.5 rounded-full border border-dark-200/10 uppercase tracking-widest"
        >
          {transactions.length} Records
        </motion.span>
      </div>

      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 flex flex-col items-center justify-center text-dark-200 border-t border-dark-200/5"
        >
          <svg className="w-10 h-10 mb-3 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs font-medium uppercase tracking-widest opacity-40">Clean Slate</p>
        </motion.div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-900/30">
                <th className="px-5 py-3 text-[10px] font-bold text-dark-200 uppercase tracking-[0.15em] border-b border-dark-200/10">Date</th>
                <th className="px-5 py-3 text-[10px] font-bold text-dark-200 uppercase tracking-[0.15em] border-b border-dark-200/10">Type</th>
                <th className="px-5 py-3 text-[10px] font-bold text-dark-200 uppercase tracking-[0.15em] border-b border-dark-200/10">Category</th>
                <th className="px-5 py-3 text-[10px] font-bold text-dark-200 uppercase tracking-[0.15em] border-b border-dark-200/10">Memo</th>
                <th className="px-5 py-3 text-[10px] font-bold text-dark-200 uppercase tracking-[0.15em] border-b border-dark-200/10 text-right">Amount</th>
                <th className="px-5 py-3 text-[10px] font-bold text-dark-200 uppercase tracking-[0.15em] border-b border-dark-200/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200/5">
              <AnimatePresence mode="popLayout">
                {transactions.map((transaction, idx) => (
                  <motion.tr
                    layout
                    key={transaction._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                    className="group hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="px-5 py-3 text-[11px] text-dark-100/70 whitespace-nowrap font-mono">
                      {new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${transaction.type === "expense"
                        ? "bg-rose-500/5 text-rose-400 border-rose-500/10"
                        : "bg-primary/5 text-primary border-primary/10"
                        }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className="text-xs font-semibold text-dark-100 hover:text-primary transition-colors cursor-help"
                        title={transaction.categorizationReason || "Selected manually"}
                      >
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-dark-200 max-w-[150px] truncate italic">
                      {transaction.description || <span className="opacity-20 italic">No note</span>}
                    </td>
                    <td className={`px-5 py-3 text-xs font-bold text-right whitespace-nowrap ${transaction.type === 'expense' ? 'text-rose-400' : 'text-primary'
                      }`}>
                      {transaction.type === 'expense' ? '-' : '+'}{currency.format(transaction.amount)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                        <button
                          className="p-1 rounded bg-dark-900 text-dark-200 hover:text-primary border border-dark-200/10 transition-all"
                          onClick={() => onEdit(transaction)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          className="p-1 rounded bg-dark-900 text-dark-200 hover:text-rose-400 border border-dark-200/10 transition-all"
                          onClick={() => void onDelete(transaction._id)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;

