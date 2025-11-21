
import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Note, Template, Task } from '../../core/types/note';
import { AppSettings } from '../../core/types/settings';
import { storage } from '../../core/db/storage';
import { toDateTimeString } from '../../core/types/common';
import { RootState } from '../../core/store/store';
import { getInitialNotes, getInitialTemplates } from '../../utils/initialData';

const notesAdapter = createEntityAdapter<Note>({
    sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt), 
});

const templatesAdapter = createEntityAdapter<Template>();

interface NotesState {
    notes: ReturnType<typeof notesAdapter.getInitialState>;
    templates: ReturnType<typeof templatesAdapter.getInitialState>;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    activeNoteId: string | null;
    searchQuery: string;
}

const initialState: NotesState = {
    notes: notesAdapter.getInitialState(),
    templates: templatesAdapter.getInitialState(),
    status: 'idle',
    error: null,
    activeNoteId: null,
    searchQuery: '',
};

export const initializeNotes = createAsyncThunk('notes/initialize', async (locale: 'en' | 'de' = 'en') => {
    await storage.init();
    let notes = await storage.getAllNotes();
    let templates = await storage.getAllTemplates();

    if (notes.length === 0) {
        notes = getInitialNotes(locale);
        await storage.saveNotes(notes);
    }
    if (templates.length === 0) {
        templates = getInitialTemplates(locale);
        await storage.saveTemplates(templates);
    }
    return { notes, templates };
});

export const addNote = createAsyncThunk(
    'notes/add',
    async ({ title, content }: { title: string; content: string }, { dispatch }) => {
        const now = toDateTimeString(new Date());
        const newNote: Note = {
            id: Date.now().toString(),
            title,
            content,
            tags: [],
            createdAt: now,
            updatedAt: now,
            pinned: false,
            history: [],
            icon: 'NotebookPen',
        };
        await storage.saveNote(newNote);
        dispatch(setActiveNoteId(newNote.id));
        return newNote;
    }
);

export const updateNote = createAsyncThunk(
    'notes/update',
    async (updatedNote: Note) => {
        const finalNote = { ...updatedNote, updatedAt: toDateTimeString(new Date()) };
        await storage.saveNote(finalNote);
        return finalNote;
    }
);

export const deleteNote = createAsyncThunk(
    'notes/delete',
    async (id: string) => {
        await storage.deleteNote(id);
        return id;
    }
);

export const togglePinNote = createAsyncThunk(
    'notes/togglePin',
    async (note: Note) => {
        const updated = { ...note, pinned: !note.pinned };
        await storage.saveNote(updated);
        return { id: note.id, changes: { pinned: updated.pinned } };
    }
);

export const batchDeleteNotes = createAsyncThunk(
    'notes/batchDelete',
    async (ids: string[]) => {
        await storage.deleteNotes(ids);
        return ids;
    }
);

export const batchPinNotes = createAsyncThunk(
    'notes/batchPin',
    async ({ ids, pin }: { ids: string[], pin: boolean }, { getState }) => {
        const state = getState() as RootState;
        const updates: Note[] = [];
        ids.forEach(id => {
            const note = state.notes.notes.entities[id];
            if (note) updates.push({ ...note, pinned: pin });
        });
        await storage.saveNotes(updates);
        return { ids, pin };
    }
);

export const batchAddTag = createAsyncThunk(
    'notes/batchAddTag',
    async ({ ids, tag }: { ids: string[], tag: string }, { getState }) => {
        const state = getState() as RootState;
        const updates: Note[] = [];
        ids.forEach(id => {
            const note = state.notes.notes.entities[id];
            if (note) {
                 const newTags = Array.from(new Set([...note.tags, tag]));
                 updates.push({ ...note, tags: newTags });
            }
        });
        await storage.saveNotes(updates);
        return updates;
    }
);

export const addTemplate = createAsyncThunk(
    'notes/addTemplate',
    async (note: Note) => {
        const newTemplate: Template = {
            id: Date.now().toString(),
            title: note.title,
            content: note.content,
            icon: note.icon,
        };
        await storage.saveTemplate(newTemplate);
        return newTemplate;
    }
);

export const deleteTemplate = createAsyncThunk(
    'notes/deleteTemplate',
    async (id: string) => {
        await storage.deleteTemplate(id);
        return id;
    }
);

export const importData = createAsyncThunk(
    'notes/import',
    async (data: { notes?: Note[], templates?: Template[], settings?: AppSettings }) => {
        if (data.notes) await storage.saveNotes(data.notes);
        if (data.templates) await storage.saveTemplates(data.templates);
        return data;
    }
);

const noteSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        setActiveNoteId: (state, action: PayloadAction<string | null>) => {
            state.activeNoteId = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(initializeNotes.fulfilled, (state, action) => {
                state.status = 'succeeded';
                notesAdapter.setAll(state.notes, action.payload.notes);
                templatesAdapter.setAll(state.templates, action.payload.templates);
            })
            .addCase(addNote.fulfilled, (state, action) => {
                notesAdapter.addOne(state.notes, action.payload);
            })
            .addCase(updateNote.fulfilled, (state, action) => {
                const existing = state.notes.entities[action.payload.id];
                if (existing) {
                    const MAX_HISTORY = 20;
                    const hasContentChanged = existing.content.trim() !== action.payload.content.trim();
                    let history = existing.history || [];
                    if (hasContentChanged) {
                        history = [{ content: existing.content, updatedAt: existing.updatedAt }, ...history].slice(0, MAX_HISTORY);
                    }
                    const noteWithHistory = { ...action.payload, history };
                    notesAdapter.upsertOne(state.notes, noteWithHistory);
                } else {
                    notesAdapter.upsertOne(state.notes, action.payload);
                }
            })
            .addCase(deleteNote.fulfilled, (state, action) => {
                notesAdapter.removeOne(state.notes, action.payload);
                if (state.activeNoteId === action.payload) state.activeNoteId = null;
            })
            .addCase(togglePinNote.fulfilled, (state, action) => {
                notesAdapter.updateOne(state.notes, action.payload);
            })
            .addCase(batchDeleteNotes.fulfilled, (state, action) => {
                notesAdapter.removeMany(state.notes, action.payload);
                if (state.activeNoteId && action.payload.includes(state.activeNoteId)) state.activeNoteId = null;
            })
            .addCase(batchPinNotes.fulfilled, (state, action) => {
                const updates = action.payload.ids.map(id => ({ id, changes: { pinned: action.payload.pin } }));
                notesAdapter.updateMany(state.notes, updates);
            })
            .addCase(batchAddTag.fulfilled, (state, action) => {
                notesAdapter.upsertMany(state.notes, action.payload);
            })
            .addCase(addTemplate.fulfilled, (state, action) => {
                templatesAdapter.addOne(state.templates, action.payload);
            })
            .addCase(deleteTemplate.fulfilled, (state, action) => {
                templatesAdapter.removeOne(state.templates, action.payload);
            })
            .addCase(importData.fulfilled, (state, action) => {
                if (action.payload.notes) notesAdapter.upsertMany(state.notes, action.payload.notes);
                if (action.payload.templates) templatesAdapter.upsertMany(state.templates, action.payload.templates);
            });
    }
});

export const { setActiveNoteId, setSearchQuery } = noteSlice.actions;
export default noteSlice.reducer;

export const {
    selectAll: selectAllNotes,
    selectById: selectNoteById,
    selectEntities: selectNoteEntities,
} = notesAdapter.getSelectors((state: RootState) => state.notes.notes);

export const {
    selectAll: selectAllTemplates,
} = templatesAdapter.getSelectors((state: RootState) => state.notes.templates);

export const selectActiveNoteId = (state: RootState) => state.notes.activeNoteId;

export const selectActiveNote = createSelector(
    [selectNoteEntities, selectActiveNoteId],
    (entities, id) => (id ? entities[id] : null)
);

export const selectFilteredNotes = createSelector(
    [selectAllNotes, (state: RootState) => state.notes.searchQuery],
    (notes, query) => {
        if (!query) return notes;
        const lowerQuery = query.toLowerCase();
        return notes.filter(n => 
            n.title.toLowerCase().includes(lowerQuery) || 
            n.content.toLowerCase().includes(lowerQuery)
        );
    }
);

export const selectAllTasks = createSelector(
    [selectAllNotes],
    (notes) => {
        const taskRegex = /^- \[( |x)\] (.*?)(?:\s@\{(\d{4}-\d{2}-\d{2})\})?$/;
        const allTasks: Task[] = [];
        
        notes.forEach(note => {
          const lines = note.content.split('\n');
          lines.forEach((line, index) => {
            if (!line.trim().startsWith('- [')) return;
            const match = line.match(taskRegex);
            if (match) {
              allTasks.push({
                id: `${note.id}-${index}`,
                text: match[2].trim(),
                done: match[1] === 'x',
                noteId: note.id,
                noteTitle: note.title || 'Untitled',
                rawLine: line,
                lineIndex: index,
                dueDate: match[3]
              });
            }
          });
        });
        return allTasks.sort((a, b) => (a.done === b.done) ? 0 : a.done ? 1 : -1);
    }
);
