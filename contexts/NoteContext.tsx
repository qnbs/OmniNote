

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Note, Task, Template, AppSettings } from '../types';
import { useLocale } from './LocaleContext';
import { getInitialNotes, getInitialTemplates } from '../utils/initialData';
import { useToast } from './ToastContext';

interface NoteContextType {
  notes: Note[];
  tasks: Task[];
  addNote: (title?: string, content?: string) => Promise<Note>;
  updateNote: (updatedNote: Note) => void;
  deleteNote: (id: string) => void;
  importData: (data: { notes?: Note[], templates?: Template[], settings?: AppSettings }) => void;
  updateTaskInNote: (task: Task) => void;
  togglePinNote: (id: string) => void;
  templates: Template[];
  addTemplate: (note: Note) => void;
  deleteTemplate: (id: string) => void;
  batchDelete: (ids: string[]) => void;
  batchTogglePin: (ids: string[], pin: boolean) => void;
  batchAddTag: (ids: string[], tag: string) => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

const MAX_HISTORY_LENGTH = 20;

// Helper function for debouncing
const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
  let timeout: number;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), delay);
  };
};

export const NoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t, locale } = useLocale();
  const { addToast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  useEffect(() => {
    if (isDataInitialized) return;
    
    try {
      const storedNotes = localStorage.getItem('omninotes');
      const storedTemplates = localStorage.getItem('omninotes_templates');

      setNotes(storedNotes ? JSON.parse(storedNotes) : getInitialNotes(locale));
      setTemplates(storedTemplates ? JSON.parse(storedTemplates) : getInitialTemplates(locale));
      
      setIsDataInitialized(true);

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setNotes(getInitialNotes(locale));
      setTemplates(getInitialTemplates(locale));
      setIsDataInitialized(true);
    }
  }, [locale, isDataInitialized]);
  
  // Debounced saving to localStorage for performance
  const debouncedSaveNotes = useCallback(debounce((notesToSave: Note[]) => {
    try {
      localStorage.setItem('omninotes', JSON.stringify(notesToSave));
    } catch (error) {
      console.error("Failed to save notes to localStorage", error);
    }
  }, 500), []);

  const debouncedSaveTemplates = useCallback(debounce((templatesToSave: Template[]) => {
     try {
        localStorage.setItem('omninotes_templates', JSON.stringify(templatesToSave));
    } catch(error) {
        console.error("Failed to save templates to localStorage", error);
    }
  }, 500), []);

  useEffect(() => {
    if (isDataInitialized) {
        debouncedSaveNotes(notes);
    }
  }, [notes, isDataInitialized, debouncedSaveNotes]);

  useEffect(() => {
    if (isDataInitialized) {
        debouncedSaveTemplates(templates);
    }
  }, [templates, isDataInitialized, debouncedSaveTemplates]);

  useEffect(() => {
    const taskRegex = /^- \[( |x)\] (.*?)(?:\s@\{(\d{4}-\d{2}-\d{2})\})?$/;
    const allTasks: Task[] = [];
    
    notes.forEach(note => {
      note.content.split('\n').forEach((line, index) => {
        const match = line.match(taskRegex);
        if (match) {
          allTasks.push({
            id: `${note.id}-${index}`,
            text: match[2].trim(),
            done: match[1] === 'x',
            noteId: note.id,
            noteTitle: note.title || t('untitledNote'),
            rawLine: line,
            lineIndex: index,
            dueDate: match[3]
          });
        }
      });
    });

    allTasks.sort((a, b) => (a.done === b.done) ? 0 : a.done ? 1 : -1);
    setTasks(allTasks);

  }, [notes, t]);

  const addNote = useCallback(async (title: string = t('untitledNote'), content: string = ''): Promise<Note> => {
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      history: [],
      icon: 'NotebookPen',
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    return newNote;
  }, [t]);

  const updateNote = useCallback((updatedNote: Note) => {
    setNotes(prevNotes =>
      prevNotes.map(note => {
        if (note.id !== updatedNote.id) {
          return note;
        }
        
        const hasContentChanged = note.content.trim() !== updatedNote.content.trim();
        const newHistory = hasContentChanged
          ? [{ content: note.content, updatedAt: note.updatedAt }, ...(note.history || [])].slice(0, MAX_HISTORY_LENGTH)
          : (note.history || []);

        return { 
            ...updatedNote, 
            updatedAt: new Date().toISOString(),
            history: newHistory,
        };
      })
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  }, []);

  const addTemplate = useCallback((note: Note) => {
      const newTemplate: Template = {
          id: Date.now().toString(),
          title: note.title,
          content: note.content,
          icon: note.icon,
      };
      setTemplates(prev => [newTemplate, ...prev]);
  }, []);

  const deleteTemplate = useCallback((id: string) => {
      setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const importData = useCallback((data: { notes?: Note[], templates?: Template[], settings?: AppSettings }) => {
      let notesAdded = 0;
      let templatesAdded = 0;
      
      if (Array.isArray(data.notes)) {
          const validNotes = data.notes.filter(n => n.id && typeof n.title !== 'undefined' && typeof n.content !== 'undefined');
          notesAdded = validNotes.length;
          
          setNotes(prevNotes => {
            const existingIds = new Set(prevNotes.map(n => n.id));
            const mergedNotes = [...prevNotes];
            validNotes.forEach(importedNote => {
                if (!existingIds.has(importedNote.id)) {
                    mergedNotes.push({ ...importedNote, history: [], pinned: false }); // Add new notes
                    existingIds.add(importedNote.id);
                }
            });
            return mergedNotes;
          });
      }

      if (Array.isArray(data.templates)) {
          const validTemplates = data.templates.filter(t => t.id && t.title);
          templatesAdded = validTemplates.length;
          setTemplates(prev => {
              const existingIds = new Set(prev.map(t => t.id));
              const merged = [...prev];
              validTemplates.forEach(imported => {
                  if(!existingIds.has(imported.id)) {
                      merged.push(imported);
                      existingIds.add(imported.id);
                  }
              });
              return merged;
          });
      }

    addToast(t('toast.importReport', { notes: notesAdded, templates: templatesAdded }), 'success');

  }, [addToast, t]);

  const batchDelete = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setNotes(prev => prev.filter(note => !idSet.has(note.id)));
  }, []);

  const batchTogglePin = useCallback((ids: string[], pin: boolean) => {
    const idSet = new Set(ids);
    setNotes(prev => prev.map(note => idSet.has(note.id) ? { ...note, pinned: pin } : note));
  }, []);
  
  const batchAddTag = useCallback((ids: string[], tag: string) => {
      if (!tag) return;
      const idSet = new Set(ids);
      setNotes(prev => prev.map(note => {
          if (idSet.has(note.id)) {
              const newTags = new Set(note.tags);
              newTags.add(tag);
              return { ...note, tags: Array.from(newTags) };
          }
          return note;
      }));
  }, []);

  const togglePinNote = useCallback((id: string) => {
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === id ? { ...note, pinned: !note.pinned } : note
        )
      );
  }, []);
  
  const updateTaskInNote = useCallback((taskToUpdate: Task) => {
    setNotes(prevNotes => {
        const note = prevNotes.find(n => n.id === taskToUpdate.noteId);
        if (!note) return prevNotes;

        const lines = note.content.split('\n');
        const { lineIndex, rawLine } = taskToUpdate;

        if (lineIndex >= lines.length || lines[lineIndex] !== rawLine) {
            console.warn("Could not find task to update. Note content may have changed.", taskToUpdate);
            return prevNotes;
        }

        const newDoneState = !taskToUpdate.done;
        const newCheckbox = newDoneState ? '[x]' : '[ ]';
        
        const newLine = rawLine.replace(/\[( |x)\]/, newCheckbox);

        lines[lineIndex] = newLine;
        const newContent = lines.join('\n');

        if (note.content === newContent) {
            return prevNotes;
        }

        return prevNotes.map(n => 
            n.id === note.id 
                ? { ...note, content: newContent, updatedAt: new Date().toISOString() } 
                : n
        );
    });
  }, []);

  const value = useMemo(() => ({
    notes,
    tasks,
    addNote,
    updateNote,
    deleteNote,
    importData,
    updateTaskInNote,
    togglePinNote,
    templates,
    addTemplate,
    deleteTemplate,
    batchDelete,
    batchTogglePin,
    batchAddTag
  }), [
    notes,
    tasks,
    addNote,
    updateNote,
    deleteNote,
    importData,
    updateTaskInNote,
    togglePinNote,
    templates,
    addTemplate,
    deleteTemplate,
    batchDelete,
    batchTogglePin,
    batchAddTag
  ]);

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
};

export const useNotes = (): NoteContextType => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};
