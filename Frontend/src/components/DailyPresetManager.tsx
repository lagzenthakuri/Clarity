import { FormEvent, useMemo, useState } from "react";
import { CATEGORIES } from "../constants";
import { DailyPreset, TransactionType } from "../types";

type PresetPayload = {
  name: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  active: boolean;
};

type DailyPresetManagerProps = {
  presets: DailyPreset[];
  onCreate: (payload: PresetPayload) => Promise<void>;
  onUpdate: (id: string, payload: Partial<PresetPayload>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onApply: (id: string) => Promise<void>;
};

const DailyPresetManager = ({
  presets,
  onCreate,
  onUpdate,
  onDelete,
  onApply,
}: DailyPresetManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isEditing = Boolean(editingId);
  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => Number(b.active) - Number(a.active)),
    [presets]
  );

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setType("expense");
    setAmount("");
    setCategory(CATEGORIES[0]);
    setDescription("");
    setActive(true);
  };

  const startEdit = (preset: DailyPreset) => {
    setEditingId(preset._id);
    setName(preset.name);
    setType(preset.type);
    setAmount(String(preset.amount));
    setCategory(preset.category);
    setDescription(preset.description || "");
    setActive(preset.active);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!name.trim() || !parsedAmount || parsedAmount <= 0) return;

    setSaving(true);
    try {
      const payload: PresetPayload = {
        name: name.trim(),
        type,
        amount: parsedAmount,
        category,
        description: description.trim(),
        active,
      };

      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card form-grid">
      <h2>Daily Presets</h2>
      <p className="muted">Create reusable daily expense/income items and add them in one click.</p>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Local bus fare"
            required
          />
        </label>
        <div className="split">
          <label>
            Type
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TransactionType)}
            >
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
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>
        </div>
        <div className="split">
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Active
            <select
              value={active ? "true" : "false"}
              onChange={(event) => setActive(event.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>
        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional note"
          />
        </label>
        <div className="row-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save preset" : "Create preset"}
          </button>
          {isEditing && (
            <button type="button" className="ghost" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="preset-list">
        {sortedPresets.length === 0 ? (
          <p className="muted">No presets yet.</p>
        ) : (
          sortedPresets.map((preset) => (
            <article key={preset._id} className="preset-item">
              <div>
                <p>
                  <strong>{preset.name}</strong> · ${preset.amount.toFixed(2)}
                </p>
                <p className="muted">
                  {preset.type} · {preset.category} · {preset.active ? "active" : "inactive"}
                </p>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  disabled={!preset.active || busyId === preset._id}
                  onClick={async () => {
                    setBusyId(preset._id);
                    try {
                      await onApply(preset._id);
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  {busyId === preset._id ? "Adding..." : "Add today"}
                </button>
                <button type="button" className="ghost" onClick={() => startEdit(preset)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => void onUpdate(preset._id, { active: !preset.active })}
                >
                  {preset.active ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => void onDelete(preset._id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default DailyPresetManager;
