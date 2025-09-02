
import React from 'react';
import { Notebook, Plus, BrainCircuit } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface BottomNavbarProps {
  onNavigate: (view: 'list' | 'sidebar') => void;
  onAddNote: () => void;
  activeView: 'list' | 'editor' | 'sidebar';
}

interface NavButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400 hover:text-primary-500'}`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
);

const AddNoteButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { t } = useLocale();
    return (
        <button 
            onClick={onClick} 
            className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg -mt-6 hover:bg-primary-700 transition-transform transform hover:scale-105"
            aria-label={t('noteList.newNote')}
        >
            <Plus className="h-7 w-7" />
        </button>
    );
};


const BottomNavbar: React.FC<BottomNavbarProps> = ({ onNavigate, onAddNote, activeView }) => {
  const { t } = useLocale();
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex md:hidden items-center justify-around z-40">
      <NavButton
        label={t('sidebar.notes')}
        icon={<Notebook className="h-6 w-6" />}
        isActive={activeView === 'list' || activeView === 'editor'}
        onClick={() => onNavigate('list')}
      />
      <AddNoteButton onClick={onAddNote} />
      <NavButton
        label={t('rightSidebar.tabs.ai')}
        icon={<BrainCircuit className="h-6 w-6" />}
        isActive={activeView === 'sidebar'}
        onClick={() => onNavigate('sidebar')}
      />
    </nav>
  );
};

export default BottomNavbar;
