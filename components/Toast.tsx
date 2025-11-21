
import React, { useEffect, useState, useCallback } from 'react';
import { ToastMessage } from '../core/types/common';
import { X, AlertTriangle, BrainCircuit, CheckCircle2 } from './icons';
import { useAppDispatch } from '../core/store/hooks';
import { removeToast } from '../features/ui/uiSlice';

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <AlertTriangle className="h-5 w-5 text-red-500" />,
  info: <BrainCircuit className="h-5 w-5 text-blue-500" />,
};

const bgColors = {
  success: 'bg-green-50 dark:bg-green-900/50 border-green-500/30',
  error: 'bg-red-50 dark:bg-red-900/50 border-red-500/30',
  info: 'bg-blue-50 dark:bg-blue-900/50 border-blue-500/30',
};

const Toast: React.FC<ToastProps> = ({ toast, duration = 4000 }) => {
  const dispatch = useAppDispatch();
  const [exiting, setExiting] = useState(false);
  
  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
        dispatch(removeToast(toast.id));
    }, 300);
  }, [dispatch, toast.id]);

  useEffect(() => {
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [handleClose, duration]);

  return (
    <div
      className={`
        flex items-center p-3 rounded-lg shadow-lg border w-80
        transition-all duration-300 ease-in-out
        ${bgColors[toast.type]}
        ${exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="ml-3 mr-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        {toast.message}
      </div>
      <button 
        onClick={handleClose} 
        className="ml-auto p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
