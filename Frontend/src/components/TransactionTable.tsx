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
    <div className="card">
      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions found for selected filters.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>
                    <span className={transaction.type === "expense" ? "pill expense" : "pill income"}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>
                    <button
                      className="ghost category-reason"
                      title={transaction.categorizationReason || "Selected manually"}
                    >
                      {transaction.category}
                    </button>
                  </td>
                  <td>{transaction.description || "-"}</td>
                  <td>{currency.format(transaction.amount)}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="ghost" onClick={() => onEdit(transaction)}>
                        Edit
                      </button>
                      <button className="danger" onClick={() => onDelete(transaction._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
