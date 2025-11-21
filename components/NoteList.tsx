
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Note } from '../types';
import { Plus, NotebookPen, Pin, ChevronLeft, LayoutTemplate, CheckSquare as CheckSquareIcon, Trash2, Tag, PinOff } from './icons';
import SearchNotes from './SearchNotes';
import NoteListItem from './NoteListItem';
import { useNotes } from '../contexts/NoteContext';
import { useLocale } from '../contexts/LocaleContext';
import { useToast } from '../contexts/ToastContext';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddNote: (templateContent?: string, templateTitle?: string) => void;
  onDeleteNote: (note: Note, triggerElement: HTMLElement) => void;
  onTogglePin: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

type SortKey = 'updatedAt' | 'createdAt' | 'title';

const NewNoteButton: React.FC<{onAddNote: (templateContent?: string, templateTitle?: string) => void}> = ({ onAddNote }) => {
    const { templates } = useNotes();
    const { t } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTemplateClick = (template: {title: string, content: string}) => {
        onAddNote(template.content, template.title);
        setIsOpen(false);
    }
    
    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex rounded-md shadow-sm">
                 <button
                    onClick={() => onAddNote()}
                    className="flex-grow flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-l-md hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {t('noteList.newNote')}
                  </button>
                  <button onClick={() => setIsOpen(!isOpen)} className="px-3 bg-primary-700 text-white rounded-r-md hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75" aria-label="More options">
                      <ChevronLeft className={`h-4 w-4 transition-transform ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
                  </button>
            </div>
            {isOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700">
                    <div className="p-1 text-xs text-slate-400 px-2 font-semibold">{t('noteList.newFromTemplate')}</div>
                    {templates.map(template => (
                        <button
                            key={template.id}
                            onClick={() => handleTemplateClick(template)}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                        >
                           <LayoutTemplate className="h-4 w-4" /> <span>{template.title}</span>
                        </button>
                    ))}
                    {templates.length === 0 && <div className="p-3 text-sm text-slate-500">{t('noteList.noTemplates')}</div>}
                </div>
            )}
        </div>
    )
}

const NoteList: React.FC<NoteListProps> = ({ notes, activeNoteId, onSelectNote, onAddNote, onDeleteNote, onTogglePin, searchQuery, setSearchQuery }) => {
  const { t } = useLocale();
  const { batchDelete, batchTogglePin, batchAddTag } = useNotes();
  const { addToast } = useToast();

  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
        if (sortKey === 'title') {
            return a.title.localeCompare(b.title);
        }
        return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime();
    });
  }, [notes, sortKey]);

  const pinnedNotes = useMemo(() => sortedNotes.filter(n => n.pinned), [sortedNotes]);
  const unpinnedNotes = useMemo(() => sortedNotes.filter(n => !n.pinned), [sortedNotes]);
  
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
    setSelectedIds(new Set());
  }, []);

  const handleSelectNoteItem = useCallback((id: string) => {
      if (isSelectMode) {
          setSelectedIds(prev => {
              const newSet = new Set(prev);
              if (newSet.has(id)) {
                  newSet.delete(id);
              } else {
                  newSet.add(id);
              }
              return newSet;
          });
      } else {
          onSelectNote(id);
      }
  }, [isSelectMode, onSelectNote]);

  const handleBatchDelete = useCallback(() => {
      batchDelete(Array.from(selectedIds));
      addToast(t('toast.batchDeleteSuccess', { count: selectedIds.size }), 'success');
      toggleSelectMode();
  }, [batchDelete, selectedIds, addToast, t, toggleSelectMode]);
  
  const handleBatchPin = useCallback((pin: boolean) => {
      batchTogglePin(Array.from(selectedIds), pin);
      addToast(pin ? t('toast.batchPinSuccess', { count: selectedIds.size }) : t('toast.batchUnpinSuccess', { count: selectedIds.size }), 'success');
      toggleSelectMode();
  }, [batchTogglePin, selectedIds, addToast, t, toggleSelectMode]);

  const handleBatchAddTag = useCallback(() => {
    const tag = tagInputRef.current?.value;
    if (tag && tag.trim() !== '') {
        batchAddTag(Array.from(selectedIds), tag.trim());
        addToast(t('toast.batchTagSuccess', { count: selectedIds.size, tag: tag.trim() }), 'success');
        toggleSelectMode();
    } else {
        addToast(t('toast.emptyTagError'), 'error');
    }
  }, [batchAddTag, selectedIds, addToast, t, toggleSelectMode]);


  const renderNoteList = (notesToRender: Note[]) => {
    return notesToRender.map(note => (
        <NoteListItem
          key={note.id}
          note={note}
          isActive={!isSelectMode && activeNoteId === note.id}
          onSelectNote={handleSelectNoteItem}
          onDeleteNote={onDeleteNote}
          onTogglePin={onTogglePin}
          searchQuery={searchQuery}
          isSelectMode={isSelectMode}
          isSelected={selectedIds.has(note.id)}
        />
      ));
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
         <NewNoteButton onAddNote={onAddNote} />
      </div>
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <SearchNotes query={searchQuery} onQueryChange={setSearchQuery} />
        <div className="flex items-center justify-between">
            <div>
                <label htmlFor="sort-notes" className="sr-only">{t('noteList.sortBy')}</label>
                <select 
                    id="sort-notes" 
                    value={sortKey} 
                    onChange={e => setSortKey(e.target.value as SortKey)}
                    className="text-xs bg-transparent dark:bg-slate-900 border-none focus:ring-0 text-slate-500 font-medium py-2"
                >
                    <option value="updatedAt">{t('noteList.sort.updated')}</option>
                    <option value="createdAt">{t('noteList.sort.created')}</option>
                    <option value="title">{t('noteList.sort.title')}</option>
                </select>
            </div>
            <button onClick={toggleSelectMode} className="text-xs font-semibold text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-md hover:bg-primary-100/50 dark:hover:bg-primary-900/50 transition-colors">
                {isSelectMode ? t('cancel') : t('noteList.select')}
            </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {notes.length > 0 ? (
          <>
            {pinnedNotes.length > 0 && (
                <div className="py-2">
                    <h2 className="px-4 pt-2 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('noteList.pinned')}</h2>
                    {renderNoteList(pinnedNotes)}
                </div>
            )}
             {pinnedNotes.length > 0 && unpinnedNotes.length > 0 && <div className="mx-4 my-2 border-t border-slate-200 dark:border-slate-800"></div>}
            {unpinnedNotes.length > 0 && (
                <div className="py-2">
                     {pinnedNotes.length > 0 && <h2 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('noteList.notes')}</h2>}
                    {renderNoteList(unpinnedNotes)}
                </div>
            )}
          </>
        ) : (
          <div className="text-center p-8 text-slate-500">
              <NotebookPen className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-lg font-semibold">{t('noteList.noNotesFound')}</h3>
              <p className="mt-1 text-sm">{searchQuery ? t('noteList.tryDifferentSearch') : t('noteList.clickNewNote')}</p>
          </div>
        )}
      </div>
      
       {isSelectMode && selectedIds.size > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg absolute bottom-0 left-0 right-0 z-20 pb-safe">
             <div className="text-sm font-semibold mb-2">{t('noteList.batch.selected', { count: selectedIds.size })}</div>
             <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <input ref={tagInputRef} type="text" placeholder={t('noteList.batch.addTagPlaceholder')} className="flex-grow w-full text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2"/>
                    <button onClick={handleBatchAddTag} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200"><Tag className="h-5 w-5"/></button>
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleBatchPin(true)} className="flex items-center justify-center gap-1 text-xs font-medium px-3 py-2 bg-slate-200 dark:bg-slate-800 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><Pin className="h-4 w-4"/>{t('noteList.batch.pin')}</button>
                    <button onClick={() => handleBatchPin(false)} className="flex items-center justify-center gap-1 text-xs font-medium px-3 py-2 bg-slate-200 dark:bg-slate-800 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><PinOff className="h-4 w-4"/>{t('noteList.batch.unpin')}</button>
                    <button onClick={handleBatchDelete} className="flex items-center justify-center gap-1 text-xs font-medium px-3 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900"><Trash2 className="h-4 w-4"/>{t('delete')}</button>
                 </div>
             </div>
        </div>
       )}
    </div>
  );
};

export default React.memo(NoteList);
