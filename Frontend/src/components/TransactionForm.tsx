import { FormEvent, useEffect, useState } from "react";
import { CATEGORIES } from "../constants";
import { Transaction } from "../types";

type TransactionFormProps = {
  onSubmit: (payload: {
    type: "income" | "expense";
    amount: number;
    category: string;
    date: string;
    description: string;
  }) => Promise<void>;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
};

const today = new Date().toISOString().slice(0, 10);

const TransactionForm = ({
  onSubmit,
  editingTransaction,
  onCancelEdit,
}: TransactionFormProps) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Food");
  const [date, setDate] = useState<string>(today);
  const [description, setDescription] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingTransaction) return;
    setType(editingTransaction.type);
    setAmount(String(editingTransaction.amount));
    setCategory(editingTransaction.category);
    setDate(editingTransaction.date.slice(0, 10));
    setDescription(editingTransaction.description || "");
  }, [editingTransaction]);

  const reset = (): void => {
    setType("expense");
    setAmount("");
    setCategory("Food");
    setDate(today);
    setDescription("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    setSaving(true);
    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        category,
        date,
        description,
      });
      reset();
    } finally {
      setSaving(false);
    }
  };

  const editing = Boolean(editingTransaction);

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>{editing ? "Edit transaction" : "Add transaction"}</h2>
      <div className="split">
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as "income" | "expense") }>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label>
          Amount
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </label>
      </div>
      <div className="split">
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
      </div>
      <label>
        Description
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note"
        />
      </label>
      <div className="row-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : editing ? "Save changes" : "Add transaction"}
        </button>
        {editing && (
          <button
            type="button"
            className="ghost"
            onClick={() => {
              onCancelEdit();
              reset();
            }}
          >
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
