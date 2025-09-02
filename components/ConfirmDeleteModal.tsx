
import React, { useEffect, useRef, useState } from 'react';
import { Note } from '../types';
import { X, AlertTriangle } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, note, onClose, onConfirm }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsEntering(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the cancel button by default as it's a less destructive action
    const cancelButton = modalRef.current?.querySelector<HTMLButtonElement>('.cancel-button');
    cancelButton?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  if (!isOpen || !note) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" 
        aria-modal="true"
        role="dialog"
    >
      <div 
        ref={modalRef}
        className={`bg-slate-50 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md m-4 transition-all duration-200 ease-out ${isEntering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="flex items-start justify-between p-4 border-b border-slate-200 dark:border-slate-800">
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    {t('deleteModal.title')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('deleteModal.description')}
                </p>
             </div>
            <button onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800" aria-label={t('deleteModal.close')}>
                <X className="h-5 w-5" />
            </button>
        </div>
        
        <div className="p-4">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{note.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {note.content.substring(0, 100) || t('noteList.noContent')}
            </p>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-100 dark:bg-slate-950/50 rounded-b-lg">
            <button
                onClick={onClose}
                className="cancel-button px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
                {t('cancel')}
            </button>
            <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
                {t('delete')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
