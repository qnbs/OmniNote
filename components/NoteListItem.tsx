import React, { useMemo } from 'react';
import { Note } from '../types';
import * as Icons from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface NoteListItemProps {
    note: Note;
    isActive: boolean;
    onSelectNote: (id: string) => void;
    onDeleteNote: (note: Note, triggerElement: HTMLElement) => void;
    onTogglePin: (id: string) => void;
    searchQuery?: string;
    isSelectMode: boolean;
    isSelected: boolean;
}

const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = Icons;

const NoteIcon: React.FC<{iconName?: string, isActive: boolean}> = React.memo(({ iconName, isActive }) => {
    const iconClass = `h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`;
    
    if (!iconName) {
        return <Icons.NotebookPen className={iconClass} />;
    }
    const IconComponent = iconMap[iconName];
    if (!IconComponent) {
        return <Icons.NotebookPen className={iconClass} />;
    }
    return <IconComponent className={iconClass} />
});

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <>{text}</>;
  }
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-slate-900 dark:text-slate-100 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};


const NoteListItem: React.FC<NoteListItemProps> = ({ note, isActive, onSelectNote, onDeleteNote, onTogglePin, searchQuery = '', isSelectMode, isSelected }) => {
    const { t, locale } = useLocale();

    const contentSnippet = useMemo(() => {
        return note.content.split('\n').find(line => line.trim().length > 0)?.replace(/#/g, '') || t('noteList.noContent');
    }, [note.content, t]);

    const formattedDate = useMemo(() => {
        try {
            return new Date(note.updatedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
        } catch (e) {
            return '';
        }
    }, [note.updatedAt, locale]);
    
    // Styles
    const containerClasses = `
        relative group flex flex-col p-3 mb-2 mx-2 rounded-lg border transition-all duration-200 ease-out
        ${isActive 
            ? 'bg-white dark:bg-slate-800 border-primary-200 dark:border-primary-900 shadow-sm' 
            : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-800'
        }
        ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30' : ''}
        cursor-pointer select-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-1 focus-within:ring-offset-slate-50 dark:focus-within:ring-offset-slate-900
        active:scale-[0.99]
    `;

    return (
        <div
            onClick={() => onSelectNote(note.id)}
            className={containerClasses}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectNote(note.id); }}
        >
            {/* Active Indicator Strip */}
            {isActive && !isSelectMode && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary-500 rounded-r-md"></div>
            )}

            <div className="flex items-start gap-3 pl-2">
                {isSelectMode && (
                    <div className="pt-1">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-slate-400 dark:border-slate-500'}`}>
                            {isSelected && <Icons.Check className="h-3 w-3 text-white" />}
                        </div>
                    </div>
                )}
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className={`font-semibold text-sm truncate pr-2 flex items-center gap-2 ${isActive ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-200'}`}>
                            {note.icon && <NoteIcon iconName={note.icon} isActive={isActive} />}
                            <span className="truncate"><HighlightedText text={note.title || t('untitledNote')} highlight={searchQuery} /></span>
                        </h3>
                        {note.pinned && <Icons.Pin className="h-3 w-3 text-slate-400 flex-shrink-0 rotate-45" />}
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        <HighlightedText text={contentSnippet} highlight={searchQuery} />
                    </p>
                    
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{formattedDate}</span>
                    </div>
                </div>
            </div>

            {/* Hover Actions - accessible via keyboard focus-within */}
            {!isSelectMode && (
                <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full p-0.5 shadow-sm">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(note.id);
                        }}
                        className="p-1.5 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors focus:outline-none focus:text-primary-600 focus:bg-primary-50 dark:focus:bg-primary-900/30"
                        title={note.pinned ? t('noteList.unpin') : t('noteList.pin')}
                        aria-label={note.pinned ? t('noteList.unpin') : t('noteList.pin')}
                    >
                        {note.pinned ? <Icons.PinOff className="h-3.5 w-3.5" /> : <Icons.Pin className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note, e.currentTarget);
                        }}
                        className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/30"
                        title={t('noteList.delete')}
                        aria-label={t('noteList.delete')}
                    >
                        <Icons.Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(NoteListItem);