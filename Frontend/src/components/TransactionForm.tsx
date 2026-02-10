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
    <form className="flex flex-col gap-5 pt-2" onSubmit={handleSubmit}>
      {/* Type Toggles */}
      <div className="flex bg-dark-800 p-1 rounded-lg self-center border border-dark-200/10">
        <button
          type="button"
          className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${type === "expense"
              ? "bg-gradient-to-br from-primary to-secondary text-white shadow-lg"
              : "text-dark-200 hover:text-white"
            }`}
          onClick={() => setType("expense")}
        >
          Expense
        </button>
        <button
          type="button"
          className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${type === "income"
              ? "bg-gradient-to-br from-primary to-secondary text-white shadow-lg"
              : "text-dark-200 hover:text-white"
            }`}
          onClick={() => setType("income")}
        >
          Income
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Amount</label>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-200/60 font-sans text-[10px] font-semibold uppercase tracking-wide">
            Nrs
          </span>
          <input
            className="w-full bg-dark-900 border-2 border-primary/50 text-white text-xl font-bold py-3 pl-14 pr-4 rounded-xl outline-none focus:border-primary focus:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all placeholder:text-dark-200/20"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Description</label>
        <input
          className="w-full bg-dark-800/50 border border-dark-200/10 text-dark-100 py-3 px-4 rounded-xl outline-none focus:border-primary/50 focus:bg-dark-900 transition-all placeholder:text-dark-200/30 text-sm"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you spend on?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Category</label>
          <div className="relative">
            <select
              className="w-full appearance-none bg-dark-800/50 border border-dark-200/10 text-dark-100 py-3 px-4 rounded-xl outline-none focus:border-primary/50 focus:bg-dark-900 transition-all text-sm cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item} className="bg-dark-900">
                  {item}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-dark-200/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Date</label>
          <input
            className="w-full bg-dark-800/50 border border-dark-200/10 text-dark-100 py-3 px-4 rounded-xl outline-none focus:border-primary/50 focus:bg-dark-900 transition-all text-sm [color-scheme:dark]"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-primary-dark hover:to-primary text-dark-900 font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : editing ? (
            "Save Changes"
          ) : (
            type === "income" ? "Add Income" : "Add Expense"
          )}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
