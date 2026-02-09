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
      <section className="card">
        <h2>Spending Intelligence</h2>
        <p className="muted">Loading intelligence insights...</p>
      </section>
    );
  }

  const maxValue = Math.max(
    1,
    ...intelligence.monthlyTrend.flatMap((item) => [item.income, item.expense])
  );

  return (
    <section className="card form-grid">
      <h2>Spending Intelligence</h2>
      <p>{intelligence.explainSummary}</p>

      <div className="metrics">
        <div className="metric">
          <p>Data Completeness</p>
          <strong>{intelligence.confidenceScore}%</strong>
          <div className="progress">
            <div className="progress-fill" style={{ width: `${intelligence.confidenceScore}%` }} />
          </div>
        </div>
        <div className="metric">
          <p>Spending Velocity</p>
          <strong>{currency.format(spendingVelocity)}/day</strong>
          <small className="muted">Based on {velocityDays} day window</small>
        </div>
      </div>

      <div className="split">
        <div>
          <h3>Monthly Income vs Expense</h3>
          <div className="trend-grid">
            {intelligence.monthlyTrend.map((item) => (
              <div className="trend-col" key={item.month}>
                <div className="trend-bars">
                  <div
                    className="trend-bar income"
                    style={{ height: `${(item.income / maxValue) * 100}%` }}
                    title={`Income ${currency.format(item.income)}`}
                  />
                  <div
                    className="trend-bar expense"
                    style={{ height: `${(item.expense / maxValue) * 100}%` }}
                    title={`Expense ${currency.format(item.expense)}`}
                  />
                </div>
                <span>{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>Category Health</h3>
          {intelligence.categoryHealth.length === 0 ? (
            <p className="muted">Not enough category history.</p>
          ) : (
            <ul className="category-list">
              {intelligence.categoryHealth.map((item) => (
                <li key={item.category} className="health-row">
                  <span>{item.category}</span>
                  <span className={`health-dot ${item.status}`} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ul className="advice-list">
        {intelligence.confidenceNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
};

export default SpendingIntelligence;
