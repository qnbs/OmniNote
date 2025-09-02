
import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ToastMessage, ToastType } from '../types';
import Toast from '../components/Toast';

interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastMessage & { duration?: number })[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {ReactDOM.createPortal(
        <div 
            className="fixed top-4 right-4 z-50 space-y-2"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
        >
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} duration={toast.duration} />
          ))}
        </div>,
        document.getElementById('toast-container')!
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
