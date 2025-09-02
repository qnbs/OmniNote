
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Note } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import * as Icons from './icons';

const iconMap: { [key: string]: React.ComponentType<any> } = Icons;

const NoteIcon: React.FC<{iconName?: string; className?: string}> = React.memo(({ iconName, className }) => {
    const defaultIconClass = "h-4 w-4";
    const finalClassName = className ? `${defaultIconClass} ${className}` : defaultIconClass;

    if (!iconName) {
        return <Icons.Notebook className={finalClassName} />;
    }
    const IconComponent = iconMap[iconName];
    if (!IconComponent) {
        return <Icons.Notebook className={finalClassName} />;
    }
    return <IconComponent className={finalClassName} />
});


// A mapping of agent names to their icons and translated titles
const AI_AGENT_MAP: { [key: string]: { icon: React.ReactNode, titleKey: string } } = {
    'analysis': { icon: <Icons.BrainCircuit className="h-4 w-4" />, titleKey: 'aiPanel.analysis.title' },
    'brainstorm': { icon: <Icons.Lightbulb className="h-4 w-4" />, titleKey: 'aiPanel.creative.title' },
    'plan': { icon: <Icons.CheckSquare className="h-4 w-4" />, titleKey: 'aiPanel.plan.title' },
    'image': { icon: <Icons.Image className="h-4 w-4" />, titleKey: 'aiPanel.image.title' },
    'research': { icon: <Icons.Search className="h-4 w-4" />, titleKey: 'aiPanel.research.title' }
};

interface Command {
    id: string;
    type: 'note' | 'action' | 'ai';
    title: string;
    category: string;
    icon: React.ReactNode;
    action: () => void;
    note?: Note;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    notes: Note[];
    activeNote: Note | null;
    onSelectNote: (noteId: string) => void;
    onAddNote: () => Promise<Note>;
    onToggleTheme: () => void;
    onShowSettings: () => void;
    onShowHelp: () => void;
    onTriggerAiAgent: (agentName: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    notes,
    activeNote,
    onSelectNote,
    onAddNote,
    onToggleTheme,
    onShowSettings,
    onShowHelp,
    onTriggerAiAgent
}) => {
    const { t } = useLocale();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isEntering, setIsEntering] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setIsEntering(true);
                inputRef.current?.focus();
            }, 10); // small delay to allow CSS transitions
            return () => clearTimeout(timer);
        } else {
            setIsEntering(false);
        }
    }, [isOpen]);

    const commands: Command[] = useMemo(() => [
        { id: 'new-note', type: 'action', category: t('commandPalette.categories.actions'), title: t('commandPalette.actions.newNote'), icon: <Icons.Plus className="h-4 w-4" />, action: onAddNote },
        { id: 'toggle-theme', type: 'action', category: t('commandPalette.categories.actions'), title: t('commandPalette.actions.toggleTheme'), icon: <Icons.Sun className="h-4 w-4" />, action: onToggleTheme },
        { id: 'settings', type: 'action', category: t('commandPalette.categories.actions'), title: t('commandPalette.actions.openSettings'), icon: <Icons.Settings className="h-4 w-4" />, action: onShowSettings },
        { id: 'help', type: 'action', category: t('commandPalette.categories.actions'), title: t('commandPalette.actions.openHelp'), icon: <Icons.HelpCircle className="h-4 w-4" />, action: onShowHelp },
    ], [t, onAddNote, onToggleTheme, onShowSettings, onShowHelp]);
    

    const aiCommands: Command[] = useMemo(() => {
        if (!activeNote) return [];
        return Object.entries(AI_AGENT_MAP).map(([key, { icon, titleKey }]) => ({
            id: `ai-${key}`,
            type: 'ai',
            category: t('commandPalette.categories.ai'),
            title: `${t(titleKey)}: ${activeNote.title}`,
            icon,
            action: () => onTriggerAiAgent(key),
        }));
    }, [activeNote, t, onTriggerAiAgent]);

    const filteredCommands = useMemo(() => {
        const lowerCaseQuery = query.toLowerCase();
        
        const noteResults: Command[] = notes
            .map(note => ({
                id: note.id,
                type: 'note' as const,
                category: t('commandPalette.categories.notes'),
                title: note.title || t('untitledNote'),
                icon: <NoteIcon iconName={note.icon} />,
                action: () => onSelectNote(note.id),
                note,
                match: (note.title.toLowerCase().includes(lowerCaseQuery) ? 10 : 0) + (note.content.toLowerCase().includes(lowerCaseQuery) ? 5 : 0)
            }))
            .filter(n => n.match > 0)
            .sort((a,b) => b.match - a.match);

        if (!lowerCaseQuery) {
            // No query: show default actions, AI actions, and all notes sorted by update date
            const allNotesSorted = notes.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(note => ({
                 id: note.id,
                type: 'note' as const,
                category: t('commandPalette.categories.notes'),
                title: note.title || t('untitledNote'),
                icon: <NoteIcon iconName={note.icon} />,
                action: () => onSelectNote(note.id),
                note
            }));
            return [...commands, ...aiCommands, ...allNotesSorted];
        }

        const actionResults = commands.filter(cmd => cmd.title.toLowerCase().includes(lowerCaseQuery));
        const aiResults = aiCommands.filter(cmd => cmd.title.toLowerCase().includes(lowerCaseQuery));

        return [...actionResults, ...aiResults, ...noteResults];
    }, [query, notes, commands, aiCommands, onSelectNote, t]);
    
    const groupedCommands = useMemo(() => {
        return filteredCommands.reduce((acc, cmd) => {
            (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
            return acc;
        }, {} as Record<string, Command[]>);
    }, [filteredCommands]);


    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);
    
    useEffect(() => {
        if (selectedIndex >= 0 && selectedIndex < filteredCommands.length) {
            const selectedElement = document.getElementById(`cmd-item-${selectedIndex}`);
            selectedElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex, filteredCommands.length]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
            }
        }
    };
    
    if (!isOpen) return null;

    let commandCounter = -1;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50" onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                className={`bg-slate-100 dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-xl mx-4 transition-all duration-200 ease-out flex flex-col ${isEntering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                role="dialog"
                aria-modal="true"
                aria-label={t('commandPalette.title')}
            >
                <div className="relative flex-shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Icons.Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('commandPalette.placeholder')}
                        className="w-full pl-11 pr-4 py-3 text-base bg-transparent border-b border-slate-200 dark:border-slate-800 focus:outline-none"
                        aria-controls="command-list"
                        aria-autocomplete="list"
                    />
                </div>
                <div ref={listRef} id="command-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2 flex-grow">
                    {filteredCommands.length > 0 ? (
                       Object.entries(groupedCommands).map(([category, cmds]) => (
                           <div key={category} className="mb-2">
                               <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider" id={`category-${category}`}>{category}</h3>
                               <ul role="group" aria-labelledby={`category-${category}`}>
                                {cmds.map((cmd) => {
                                   commandCounter++;
                                   const currentIndex = commandCounter;
                                   return (
                                     <li
                                        key={`${cmd.id}-${cmd.title}`}
                                        id={`cmd-item-${currentIndex}`}
                                        onClick={cmd.action}
                                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                                        className={`flex items-center gap-3 p-2 my-1 rounded-md cursor-pointer text-sm ${selectedIndex === currentIndex ? 'bg-primary-500 text-white' : 'text-slate-700 dark:text-slate-200'}`}
                                        role="option"
                                        aria-selected={selectedIndex === currentIndex}
                                    >
                                        <span className={selectedIndex === currentIndex ? 'text-white' : 'text-slate-500'}>{cmd.icon}</span>
                                        <div className="flex-grow overflow-hidden">
                                            <span className="truncate">{cmd.title}</span>
                                            {cmd.type === 'note' && cmd.note && (
                                                <p className={`text-xs truncate ${selectedIndex === currentIndex ? 'text-primary-200' : 'text-slate-400'}`}>
                                                    {cmd.note.content.split('\n').find(line => line.trim().length > 0) || t('noteList.noContent')}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                   )
                               })}
                               </ul>
                           </div>
                       ))
                    ) : (
                        <div className="p-4 text-center text-slate-500">{t('commandPalette.noResults')}</div>
                    )}
                </div>
                 <div className="p-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between flex-shrink-0">
                     <span>{t('commandPalette.navTip')}</span>
                     <span>{t('commandPalette.closeTip')}</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;