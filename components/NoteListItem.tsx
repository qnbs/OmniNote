

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

const iconMap: { [key: string]: React.ComponentType<any> } = Icons;

const NoteIcon: React.FC<{iconName?: string}> = React.memo(({ iconName }) => {
    const defaultIconClass = "h-5 w-5 text-slate-500 dark:text-slate-400 mr-2 mt-0.5 flex-shrink-0";
    if (!iconName) {
        return <Icons.NotebookPen className={defaultIconClass} />;
    }
    const IconComponent = iconMap[iconName];
    if (!IconComponent) {
        return <Icons.NotebookPen className={defaultIconClass} />;
    }
    return <IconComponent className={defaultIconClass} />
});

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
          <mark key={i} className="bg-primary-200 dark:bg-primary-800 rounded-sm px-0.5 text-slate-900 dark:text-slate-100">
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
            return new Date(note.updatedAt).toLocaleDateString(locale, { year: '2-digit', month: 'short', day: 'numeric' });
        } catch (e) {
            return 'Invalid Date';
        }
    }, [note.updatedAt, locale]);
    
    const baseClasses = "cursor-pointer p-3 m-2 rounded-lg transition-colors group relative flex items-start";
    const activeClasses = isActive ? 'bg-primary-100 dark:bg-primary-900' : 'hover:bg-slate-200 dark:hover:bg-slate-800';
    const selectedClasses = isSelected ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500' : '';
    const finalClasses = `${baseClasses} ${isSelectMode ? selectedClasses : activeClasses}`;


    return (
        <div
            onClick={() => onSelectNote(note.id)}
            className={finalClasses}
        >
            {isSelectMode && (
                <div className="flex-shrink-0 pt-1 mr-2">
                    <div className={`h-4 w-4 rounded-sm border-2 ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-slate-400'}`}>
                        {isSelected && <Icons.Check className="h-3 w-3 text-white" />}
                    </div>
                </div>
            )}
            <NoteIcon iconName={note.icon} />
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 pr-2 truncate">
                        <HighlightedText text={note.title || t('untitledNote')} highlight={searchQuery} />
                    </h3>
                     <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex-shrink-0">
                        {formattedDate}
                    </p>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    <HighlightedText text={contentSnippet} highlight={searchQuery} />
                </p>

              </div>
             {note.pinned && <Icons.Pin className="h-3 w-3 text-slate-400 dark:text-slate-500 absolute top-2 left-2" />}
            {!isSelectMode && (
                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(note.id);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:bg-slate-300 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        aria-label={note.pinned ? t('noteList.unpin') : t('noteList.pin')}
                        title={note.pinned ? t('noteList.unpin') : t('noteList.pin')}
                    >
                        {note.pinned ? <Icons.PinOff className="h-4 w-4" /> : <Icons.Pin className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note, e.currentTarget);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                        aria-label={t('noteList.delete')}
                        title={t('noteList.delete')}
                    >
                        <Icons.Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(NoteListItem);