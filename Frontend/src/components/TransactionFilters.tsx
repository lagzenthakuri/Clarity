import { CATEGORIES } from "../constants";
import { TransactionFilters } from "../types";

type TransactionFiltersProps = {
  filters: TransactionFilters;
  onChange: (nextFilters: TransactionFilters) => void;
  onReset: () => void;
};

const TransactionFiltersPanel = ({ filters, onChange, onReset }: TransactionFiltersProps) => {
  return (
    <div className="card form-grid">
      <h2>Filters</h2>
      <div className="split">
        <label>
          Category
          <select
            value={filters.category}
            onChange={(event) =>
              onChange({
                ...filters,
                category: event.target.value,
              })
            }
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select
            value={filters.type}
            onChange={(event) =>
              onChange({ ...filters, type: event.target.value as TransactionFilters["type"] })
            }
          >
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
      </div>
      <div className="split">
        <label>
          Start date
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
          />
        </label>
      </div>
      <div className="row-actions">
        <button className="ghost" type="button" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </div>
  );
};

export default TransactionFiltersPanel;
