import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 min-w-[300px] p-4 rounded-lg shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-full duration-300
              ${t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' : ''}
              ${t.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' : ''}
              ${t.type === 'warning' ? 'bg-yellow-950/90 border-yellow-500/30 text-yellow-200' : ''}
              ${t.type === 'info' ? 'bg-slate-900/90 border-slate-700 text-slate-200' : ''}
            `}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            
            <span className="text-sm font-medium flex-1">{t.message}</span>
            
            <button onClick={() => removeToast(t.id)} className="hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};