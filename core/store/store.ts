
import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import notesReducer, { addNote, deleteNote, importData, updateNote, togglePinNote, addTemplate } from '../../features/notes/noteSlice';
import settingsReducer, { setSetting, setAiSetting, resetSettings } from '../../features/settings/settingsSlice';
import aiReducer from '../../features/ai/aiSlice';
import uiReducer, { addToast } from '../../features/ui/uiSlice';

// Create the listener middleware
const listenerMiddleware = createListenerMiddleware();

// --- Persistence Listeners ---

// Auto-save Settings
listenerMiddleware.startListening({
  matcher: isAnyOf(setSetting, setAiSetting, resetSettings),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    localStorage.setItem('omninote_settings', JSON.stringify(state.settings));
  },
});

// Toast Notifications for Actions
listenerMiddleware.startListening({
  actionCreator: deleteNote.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(addToast({ message: 'Note moved to trash', type: 'success' }));
  },
});

listenerMiddleware.startListening({
  actionCreator: addTemplate.fulfilled,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(addToast({ message: 'Template saved successfully', type: 'success' }));
  },
});

listenerMiddleware.startListening({
    actionCreator: importData.fulfilled,
    effect: async (action, listenerApi) => {
        const { notes, templates } = action.payload;
        const count = (notes?.length || 0);
        const tmplCount = (templates?.length || 0);
        listenerApi.dispatch(addToast({ 
            message: `Imported ${count} notes and ${tmplCount} templates.`, 
            type: 'success' 
        }));
    }
});

export const store = configureStore({
  reducer: {
    notes: notesReducer,
    settings: settingsReducer,
    ai: aiReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
