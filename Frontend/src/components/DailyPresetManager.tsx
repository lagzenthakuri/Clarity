import { motion, AnimatePresence } from "framer-motion";
import { FormEvent, useMemo, useState } from "react";
import { CATEGORIES } from "../constants";
import Modal from "./Modal";
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
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

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
    setCategory(CATEGORIES[1]);
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
    setIsPresetModalOpen(true);
  };

  const startCreate = () => {
    resetForm();
    setIsPresetModalOpen(true);
  };

  const closeModal = () => {
    setIsPresetModalOpen(false);
    resetForm();
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
      setIsPresetModalOpen(false);
      resetForm();
    } catch {
      // Toast feedback is handled by parent callbacks.
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <p className="text-xs text-dark-200">One-tap records for recurring daily items.</p>
        </div>
        <button
          type="button"
          className="btn-primary flex items-center gap-1.5 !px-3 !py-1.5 whitespace-nowrap"
          onClick={startCreate}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Quick Action
        </button>
      </div>

      <div>
          {sortedPresets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 border border-dashed border-dark-200/5 rounded-xl bg-dark-900/10">
              <p className="text-dark-200 text-[10px] font-bold uppercase tracking-widest opacity-30">No presets defined</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {sortedPresets.map((preset) => (
                  <motion.article
                    layout
                    key={preset._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -2 }}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${preset.active
                      ? "bg-dark-900/50 border-dark-200/10 hover:border-primary/20"
                      : "bg-dark-900/10 border-dark-200/5 opacity-50 grayscale-[0.3]"
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-dark-100 text-xs truncate pr-1">{preset.name}</h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${preset.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                          ${preset.amount.toFixed(0)}
                        </span>
                      </div>
                      <p className="text-[9px] text-dark-200 uppercase tracking-widest font-bold">
                        {preset.category}
                      </p>
                    </div>

                    <div className="flex gap-1.5 pt-2 border-t border-dark-200/5">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded transition-all flex-grow text-center ${preset.active
                          ? "bg-primary text-white hover:brightness-110"
                          : "bg-dark-900 text-dark-200 cursor-not-allowed"
                          }`}
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
                        {busyId === preset._id ? "..." : "Add"}
                      </motion.button>
                      <button
                        type="button"
                        className="p-1.5 rounded bg-dark-900 text-dark-200 hover:text-dark-100 border border-dark-200/10 transition-colors"
                        onClick={() => startEdit(preset)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded bg-dark-900 text-dark-200 hover:text-rose-400 border border-dark-200/10 transition-colors"
                        onClick={() => void onDelete(preset._id)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
      </div>

      <Modal
        isOpen={isPresetModalOpen}
        onClose={closeModal}
        title={isEditing ? "Update Quick Action" : "New Quick Action"}
      >
        <motion.form layout className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Label</label>
            <input
              type="text"
              className="input-field py-2 text-xs"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Morning Coffee"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Type</label>
              <select
                className="input-field appearance-none py-2 text-xs"
                value={type}
                onChange={(event) => setType(event.target.value as TransactionType)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field py-2 text-xs"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Category</label>
              <select
                className="input-field appearance-none py-2 text-xs"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-dark-200 uppercase tracking-widest ml-1">Status</label>
              <select
                className="input-field appearance-none py-2 text-xs"
                value={active ? "true" : "false"}
                onChange={(event) => setActive(event.target.value === "true")}
              >
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="btn-primary flex-grow text-xs font-bold uppercase tracking-widest"
              disabled={saving}
            >
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
            <button type="button" className="btn-ghost text-xs" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </motion.form>
      </Modal>
    </section>
  );
};

export default DailyPresetManager;
