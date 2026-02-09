import { DashboardSummary } from "../types";

type MonthlyWidgetsProps = {
  summary: DashboardSummary;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const MonthlyWidgets = ({ summary }: MonthlyWidgetsProps) => {
  const topCategories = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <section className="card">
      <h2>This Month Snapshot</h2>
      <div className="metrics">
        <div className="metric">
          <p>Total Income (This Month)</p>
          <strong>{currency.format(summary.totalIncome)}</strong>
        </div>
        <div className="metric">
          <p>Total Expense (This Month)</p>
          <strong>{currency.format(summary.totalExpense)}</strong>
        </div>
        <div className="metric">
          <p>Balance</p>
          <strong>{currency.format(summary.balance)}</strong>
        </div>
      </div>
      <h3>Top 3 Spending Categories</h3>
      {topCategories.length === 0 ? (
        <p>No expense data this month.</p>
      ) : (
        <ul className="category-list">
          {topCategories.map(([category, amount]) => (
            <li key={category} className="category-row">
              <span>{category}</span>
              <span>{currency.format(amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MonthlyWidgets;
