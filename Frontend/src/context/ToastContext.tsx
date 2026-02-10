import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_TTL_MS = 3500;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "success"): void => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => removeToast(id), TOAST_TTL_MS);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string): void => {
      showToast(message, "success");
    },
    [showToast]
  );

  const error = useCallback(
    (message: string): void => {
      showToast(message, "error");
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      success,
      error,
    }),
    [showToast, success, error]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section className="fixed right-4 top-4 z-[70] flex w-[min(92vw,420px)] flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={`pointer-events-auto rounded-xl border px-3 py-2.5 shadow-xl backdrop-blur-sm ${
                toast.tone === "success"
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-danger/10 border-danger/30 text-danger"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
                <button
                  type="button"
                  className="shrink-0 text-[10px] uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
                  onClick={() => removeToast(toast.id)}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
};
