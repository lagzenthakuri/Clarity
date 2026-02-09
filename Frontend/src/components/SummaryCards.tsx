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
    <div className="card">
      <h2>Overview</h2>
      <div className="metrics">
        <div className="metric">
          <p>Total Income</p>
          <strong>{currency.format(summary.totalIncome)}</strong>
        </div>
        <div className="metric">
          <p>Total Expense</p>
          <strong>{currency.format(summary.totalExpense)}</strong>
        </div>
        <div className="metric">
          <p>Balance</p>
          <strong>{currency.format(summary.balance)}</strong>
        </div>
      </div>
      <h3>Expense by category</h3>
      {sortedCategories.length === 0 ? (
        <p>No expense data for selected period.</p>
      ) : (
        <ul className="category-list">
          {sortedCategories.map(([category, value]) => {
            const ratio = summary.totalExpense ? (value / summary.totalExpense) * 100 : 0;
            return (
              <li key={category}>
                <div className="category-row">
                  <span>{category}</span>
                  <span>{currency.format(value)}</span>
                </div>
                <div className="bar">
                  <div className="fill" style={{ width: `${ratio}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SummaryCards;
