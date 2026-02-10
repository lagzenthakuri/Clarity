import { motion } from "framer-motion";
import { CATEGORIES } from "../constants";
import { TransactionFilters } from "../types";

type TransactionFiltersProps = {
  filters: TransactionFilters;
  onChange: (nextFilters: TransactionFilters) => void;
  onReset: () => void;
};

const TransactionFiltersPanel = ({ filters, onChange, onReset }: TransactionFiltersProps) => {
  return (
    <motion.div layout className="card flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-[10px] font-bold uppercase tracking-widest text-dark-200 hover:text-primary transition-colors bg-dark-900/50 px-3 py-1.5 rounded-lg border border-dark-200/10"
          type="button"
          onClick={onReset}
        >
          Clear
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Category",
            component: (
              <select
                className="input-field appearance-none py-2 text-xs"
                value={filters.category}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    category: event.target.value,
                  })
                }
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            ),
          },
          {
            label: "Type",
            component: (
              <select
                className="input-field appearance-none py-2 text-xs"
                value={filters.type}
                onChange={(event) =>
                  onChange({ ...filters, type: event.target.value as TransactionFilters["type"] })
                }
              >
                <option value="">All Types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            ),
          },
          {
            label: "Start",
            component: (
              <input
                type="date"
                className="input-field py-2 text-xs"
                value={filters.startDate}
                onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
              />
            ),
          },
          {
            label: "End",
            component: (
              <input
                type="date"
                className="input-field py-2 text-xs"
                value={filters.endDate}
                onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
              />
            ),
          },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="flex flex-col gap-1"
          >
            <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">{item.label}</label>
            {item.component}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TransactionFiltersPanel;

