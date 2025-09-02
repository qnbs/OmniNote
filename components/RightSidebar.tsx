


import React, { useState } from 'react';
import { Note } from '../types';
import AiAgentPanel from './AiAgentPanel';
import KnowledgeGraph from './KnowledgeGraph';
import VersionHistory from './VersionHistory';
import { BrainCircuit, Share2, History, X } from './icons';
import { useTheme } from './ThemeProvider';
import { useNotes } from '../contexts/NoteContext';
import { useLocale } from '../contexts/LocaleContext';

type ViewMode = 'ai' | 'graph' | 'history';

interface RightSidebarProps {
  activeNote: Note | null;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onClose: () => void;
}

const Slider: React.FC<{label: string, value: number, min: number, max: number, step: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ label, ...props}) => (
    <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
        <input type="range" {...props} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"/>
    </div>
);

const GraphSettings: React.FC<{
    charge: number;
    linkDistance: number;
    setCharge: (n: number) => void;
    setLinkDistance: (n: number) => void;
}> = ({ charge, linkDistance, setCharge, setLinkDistance }) => {
    const { t } = useLocale();
    return (
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-semibold text-sm">{t('rightSidebar.graphSettings')}</h4>
            <Slider 
                label={`${t('rightSidebar.repulsion')}: ${charge}`}
                value={charge}
                min={-1000}
                max={-50}
                step={50}
                onChange={(e) => setCharge(parseInt(e.target.value))}
            />
            <Slider 
                label={`${t('rightSidebar.linkDistance')}: ${linkDistance}`}
                value={linkDistance}
                min={30}
                max={300}
                step={10}
                onChange={(e) => setLinkDistance(parseInt(e.target.value))}
            />
        </div>
    );
}


const RightSidebar: React.FC<RightSidebarProps> = ({ activeNote, notes, onSelectNote, onClose }) => {
  const [view, setView] = useState<ViewMode>('ai');
  const [charge, setCharge] = useState(-400);
  const [linkDistance, setLinkDistance] = useState(120);
  const { theme } = useTheme();
  const { updateNote } = useNotes();
  const { t } = useLocale();

  const graphColors = {
    link: theme === 'dark' ? 'hsl(210 40% 30%)' : 'hsl(210 40% 80%)',
    node: theme === 'dark' ? 'hsl(210 40% 60%)' : 'hsl(210 40% 50%)',
    activeNode: theme === 'dark' ? 'hsl(202 94% 60%)' : 'hsl(202 84% 50%)',
    text: theme === 'dark' ? 'hsl(210 40% 90%)' : 'hsl(210 40% 20%)',
    stroke: theme === 'dark' ? 'hsl(210 40% 10%)' : 'hsl(210 40% 98%)',
  };
  
  const TABS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'ai', label: t('rightSidebar.tabs.ai'), icon: <BrainCircuit className="h-4 w-4" /> },
    { id: 'graph', label: t('rightSidebar.tabs.graph'), icon: <Share2 className="h-4 w-4" /> },
    { id: 'history', label: t('rightSidebar.tabs.history'), icon: <History className="h-4 w-4" /> },
  ];


  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-4 p-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 md:hidden" aria-label={t('rightSidebar.close')} title={t('rightSidebar.close')}>
          <X className="h-6 w-6" />
        </button>
        <div className="flex-grow flex justify-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
          {TABS.map(tab => (
            <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                title={tab.label}
                className={`w-1/3 py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                view === tab.id ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'
                }`}
            >
                {tab.icon}
                <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {view === 'graph' && (
          <GraphSettings
            charge={charge}
            linkDistance={linkDistance}
            setCharge={setCharge}
            setLinkDistance={setLinkDistance}
          />
      )}

      <div className="flex-1 overflow-y-auto">
        {view === 'ai' && (
          <AiAgentPanel key={activeNote?.id} activeNote={activeNote} />
        )}
        {view === 'graph' && (
          <KnowledgeGraph 
              notes={notes} 
              onNodeClick={onSelectNote} 
              activeNodeId={activeNote?.id ?? null}
              colors={graphColors}
              charge={charge}
              linkDistance={linkDistance}
          />
        )}
        {view === 'history' && (
          <VersionHistory
            key={activeNote?.id}
            activeNote={activeNote}
            onRestore={(content) => activeNote && updateNote({ ...activeNote, content })}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(RightSidebar);