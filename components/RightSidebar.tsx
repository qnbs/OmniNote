import React, { useState } from 'react';
import { Note } from '../core/types/note';
import AiAgentPanel from './AiAgentPanel';
import KnowledgeGraph from './KnowledgeGraph';
import VersionHistory from './VersionHistory';
import { BrainCircuit, Share2, History, X } from './icons';
import { useTheme } from './ThemeProvider';
import { useAppDispatch, useAppSelector } from '../core/store/hooks';
import { updateNote } from '../features/notes/noteSlice';
import { setRightSidebarView } from '../features/ui/uiSlice';
import { useLocale } from '../contexts/LocaleContext';

interface RightSidebarProps {
  activeNote: Note | null;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onClose: () => void;
}

const Slider: React.FC<{label: string, value: number, min: number, max: number, step: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ label, ...props}) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
        <input type="range" {...props} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"/>
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
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <Share2 className="h-3.5 w-3.5"/> {t('rightSidebar.graphSettings')}
            </div>
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

type ViewMode = 'ai' | 'graph' | 'history';

const RightSidebar: React.FC<RightSidebarProps> = ({ activeNote, notes, onSelectNote, onClose }) => {
  const dispatch = useAppDispatch();
  const view = useAppSelector(state => state.ui.activeRightSidebarView);
  const [charge, setCharge] = useState(-400);
  const [linkDistance, setLinkDistance] = useState(120);
  const { theme } = useTheme();
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3 md:hidden">
             <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Tools</span>
             <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
                <X className="h-5 w-5" />
             </button>
        </div>
        <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg">
          {TABS.map(tab => (
            <button
                key={tab.id}
                onClick={() => dispatch(setRightSidebarView(tab.id))}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                view === tab.id 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-[1.02]' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
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

      <div className="flex-1 overflow-y-auto pb-safe">
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
            onRestore={(content) => activeNote && dispatch(updateNote({ ...activeNote, content }))}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(RightSidebar);