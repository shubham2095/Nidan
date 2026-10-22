import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { Icon: CheckCircle2, classes: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  error: { Icon: AlertCircle, classes: 'border-red-200 bg-red-50 text-red-900' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (type, message) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ success: (message) => show('success', message), error: (message) => show('error', message) }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="fixed right-4 bottom-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 print:hidden">
        {toasts.map(({ id, type, message }) => {
          const { Icon, classes } = STYLES[type];
          return (
            <div key={id} role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm shadow-lg ${classes}`}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="flex-1">{message}</p>
              <button type="button" onClick={() => dismiss(id)} aria-label="Dismiss" className="rounded p-0.5 hover:bg-black/5">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
