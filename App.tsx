
import React, { useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Note, ImportData } from './types';
import NoteList from './components/NoteList';
import NoteEditor, { NoteEditorHandle } from './components/NoteEditor';
import RightSidebar from './components/RightSidebar';
import { ThemeProvider, useTheme, ThemeToggle } from './components/ThemeProvider';
import { BrainCircuit, BookOpenCheck, Settings, Notebook, CheckSquare, LayoutTemplate, HelpCircle, Command } from './components/icons';
import BottomNavbar from './components/BottomNavbar';
import TaskView from './components/TaskView';
import TemplateView from './components/TemplateView';
import { LocaleProvider, useLocale } from './contexts/LocaleContext';
import { useAppDispatch, useAppSelector } from './core/store/hooks';
import { initializeNotes, selectActiveNote, selectFilteredNotes, selectActiveNoteId, setActiveNoteId, addNote, deleteNote, togglePinNote, importData, setSearchQuery } from './features/notes/noteSlice';
import { openModal, closeModal, setSidebarOpen, setLeftSidebarView, setRightSidebarView, addToast } from './features/ui/uiSlice';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import SettingsModal from './components/SettingsModal';
import HelpCenter from './components/HelpCenter';
import CommandPalette from './components/CommandPalette';
import Toast from './components/Toast';
import { store } from './core/store/store';

const MemoizedRightSidebar = React.memo(RightSidebar);

// --- Logic Hook ---
const useAppLogic = () => {
  const dispatch = useAppDispatch();
  const { t, locale } = useLocale();
  const { theme, setTheme } = useTheme();
  
  // Redux State Selectors
  const notes = useAppSelector(selectFilteredNotes);
  const activeNote = useAppSelector(selectActiveNote);
  const activeNoteId = useAppSelector(selectActiveNoteId);
  const settings = useAppSelector(state => state.settings);
  const ui = useAppSelector(state => state.ui);
  const allNotes = useAppSelector(state => state.notes.notes.ids.map(id => state.notes.notes.entities[id]!));
  const searchQuery = useAppSelector(state => state.notes.searchQuery);
  const toasts = useAppSelector(state => state.ui.toasts);

  const editorRef = useRef<NoteEditorHandle>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  // Initialization
  useEffect(() => {
      dispatch(initializeNotes(locale));
  }, [dispatch, locale]);

  useEffect(() => {
    if (activeNote) {
      document.title = `${activeNote.title} - OmniNote`;
    } else {
      document.title = t('appTitle');
    }
  }, [activeNote, t]);

  // Handlers
  const handleSelectNote = useCallback((id: string) => {
    dispatch(setActiveNoteId(id));
    dispatch(setLeftSidebarView('notes'));
    if (window.innerWidth < 768) {
      dispatch(setSidebarOpen(false));
    }
  }, [dispatch]);

  const handleAddNote = useCallback(async (templateContent: string = '', templateTitle: string = t('untitledNote')) => {
    const result = await dispatch(addNote({ title: templateTitle, content: templateContent }));
    if (addNote.fulfilled.match(result)) {
        dispatch(setLeftSidebarView('notes'));
        if(window.innerWidth < 768) {
            dispatch(setSidebarOpen(false));
        } else {
            setTimeout(() => {
                editorRef.current?.focusTitle();
            }, 100);
        }
        return result.payload;
    }
  }, [dispatch, t]);

  const handleShowCommandPalette = useCallback(() => {
    dispatch(openModal({ type: 'commandPalette' }));
  }, [dispatch]);

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        handleAddNote();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleShowCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddNote, handleShowCommandPalette]);

  const confirmDelete = useCallback((noteToDelete: Note) => {
    const noteToDeleteIndex = notes.findIndex(n => n.id === noteToDelete.id);
    let nextActiveId: string | null = null;
    if (activeNoteId === noteToDelete.id && notes.length > 1) {
         const potentialNext = notes[noteToDeleteIndex === notes.length - 1 ? noteToDeleteIndex - 1 : noteToDeleteIndex + 1];
         if(potentialNext) nextActiveId = potentialNext.id;
    }
    
    dispatch(deleteNote(noteToDelete.id));
    if(nextActiveId) dispatch(setActiveNoteId(nextActiveId));
    
    dispatch(closeModal());
  }, [activeNoteId, notes, dispatch]);

  const handleDeleteRequest = useCallback((note: Note, triggerElement: HTMLElement) => {
    dispatch(openModal({ 
        type: 'deleteConfirm', 
        props: { note }
    }));
  }, [dispatch]);

  const handleExport = useCallback((exportType: 'all' | 'notes' | 'templates' | 'settings') => {
    try {
        const state = store.getState();
        let dataToExport: ImportData = {};
        let filename = `omninote_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const currentNotes = state.notes.notes.ids.map(id => state.notes.notes.entities[id]!);
        const currentTemplates = state.notes.templates.ids.map(id => state.notes.templates.entities[id]!);
        const currentSettings = state.settings;

        switch(exportType) {
            case 'all': dataToExport = { notes: currentNotes, templates: currentTemplates, settings: currentSettings }; break;
            case 'notes': dataToExport = { notes: currentNotes }; filename = 'omninote_notes_export.json'; break;
            case 'templates': dataToExport = { templates: currentTemplates }; filename = 'omninote_templates_export.json'; break;
            case 'settings': dataToExport = { settings: currentSettings }; filename = 'omninote_settings_export.json'; break;
        }
        
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        dispatch(addToast({ message: t('toast.exportSuccess'), type: 'success' }));
    } catch(e) {
        console.error(e);
        dispatch(addToast({ message: t('toast.exportFailed'), type: 'error' }));
    }
  }, [dispatch, t]);

  return {
      // State
      notes, activeNote, activeNoteId, settings, ui, allNotes, searchQuery, toasts,
      editorRef, settingsButtonRef, helpButtonRef, theme, locale, t,
      // Actions
      setTheme,
      handleSelectNote,
      handleAddNote,
      handleShowCommandPalette,
      handleDeleteRequest,
      handleExport,
      confirmDelete,
      setSearchQuery: (q: string) => dispatch(setSearchQuery(q)),
      togglePinNote: (id: string) => { const n = allNotes.find(x=>x.id===id); if(n) dispatch(togglePinNote(n)); },
      setSidebarOpen: (open: boolean) => dispatch(setSidebarOpen(open)),
      setLeftSidebarView: (view: 'notes'|'tasks'|'templates') => dispatch(setLeftSidebarView(view)),
      setRightSidebarView: (view: 'ai'|'graph'|'history') => dispatch(setRightSidebarView(view)),
      openModal: (p: any) => dispatch(openModal(p)),
      closeModal: () => dispatch(closeModal()),
      importData: (d: ImportData) => dispatch(importData(d)),
      setActiveNoteId: (id: string|null) => dispatch(setActiveNoteId(id)),
      addToast: (msg: any) => dispatch(addToast(msg)),
  };
}

// --- Context ---
type AppContextType = ReturnType<typeof useAppLogic>;
const AppContext = createContext<AppContextType | null>(null);
const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used within AppContent");
    return ctx;
}

// --- Components ---

const LeftSidebar = () => {
    const { ui, t, setLeftSidebarView, notes, activeNoteId, handleSelectNote, handleAddNote, handleDeleteRequest, togglePinNote, searchQuery, setSearchQuery, allNotes, handleShowCommandPalette, helpButtonRef, openModal, settingsButtonRef } = useAppContext();
    
    return (
        <div className={`
            w-full flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900
            md:w-1/4 md:max-w-sm md:flex
            ${activeNoteId ? 'hidden md:flex' : 'flex'}
            absolute md:relative h-full z-10 transition-transform duration-300
          `}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 compact-py comfortable-py bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg shadow-lg shadow-primary-500/20 text-white">
                    <BrainCircuit className="h-6 w-6"/>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">OmniNote</h1>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleShowCommandPalette} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <Command className="h-5 w-5" />
                </button>
                <button ref={helpButtonRef} onClick={() => openModal({ type: 'help' })} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <HelpCircle className="h-5 w-5" />
                </button>
                <button ref={settingsButtonRef} onClick={() => openModal({ type: 'settings' })} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
                <ThemeToggle />
              </div>
            </div>
            
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
                    <button onClick={() => setLeftSidebarView('notes')} className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${ui.activeLeftSidebarView === 'notes' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}><Notebook className="h-3.5 w-3.5" />{t('sidebar.notes')}</button>
                    <button onClick={() => setLeftSidebarView('tasks')} className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${ui.activeLeftSidebarView === 'tasks' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}><CheckSquare className="h-3.5 w-3.5" />{t('sidebar.tasks')}</button>
                    <button onClick={() => setLeftSidebarView('templates')} className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${ui.activeLeftSidebarView === 'templates' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}><LayoutTemplate className="h-3.5 w-3.5" />{t('sidebar.templates')}</button>
                </div>
            </div>

            {ui.activeLeftSidebarView === 'notes' && (
                <NoteList
                    notes={notes}
                    activeNoteId={activeNoteId}
                    onSelectNote={handleSelectNote}
                    onAddNote={handleAddNote}
                    onDeleteNote={handleDeleteRequest}
                    onTogglePin={togglePinNote}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            )}
            {ui.activeLeftSidebarView === 'tasks' && (
                <TaskView onSelectNote={handleSelectNote} />
            )}
            {ui.activeLeftSidebarView === 'templates' && (
                 <TemplateView
                    onUseTemplate={(content, title) => handleAddNote(content, `${t('newFromTemplatePrefix')} ${title}`)}
                  />
            )}
        </div>
    );
}

const MainContent = () => {
    const { activeNoteId, activeNote, handleAddNote, editorRef, allNotes, handleSelectNote, t } = useAppContext();

    return (
        <main className={`flex-1 flex-col w-full ${activeNoteId ? 'flex' : 'hidden md:flex'} relative z-0 bg-white dark:bg-slate-950 transition-colors duration-300`}>
            {activeNote ? (
              <NoteEditor ref={editorRef} key={activeNote.id} note={activeNote} allNotes={allNotes} onSelectNote={handleSelectNote} />
            ) : (
              <div className="hidden items-center justify-center h-full text-slate-400 dark:text-slate-600 md:flex bg-slate-50/30 dark:bg-slate-900/20">
                <div className="text-center max-w-md px-6">
                  <div className="mx-auto h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <BookOpenCheck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">{t('editor.selectNote')}</p>
                  <button onClick={() => handleAddNote()} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 active:scale-95">{t('editor.createNewNote')}</button>
                </div>
              </div>
            )}
        </main>
    )
}

const GlobalModals = () => {
    const { ui, closeModal, handleExport, importData, notes, activeNote, handleSelectNote, handleAddNote, setTheme, theme, openModal, addToast, setRightSidebarView, setSidebarOpen, t, confirmDelete } = useAppContext();
    
    return (
        <>
            {ui.modal.isOpen && ui.modal.type === 'deleteConfirm' && <ConfirmDeleteModal isOpen={true} onClose={closeModal} note={ui.modal.props.note} onConfirm={() => confirmDelete(ui.modal.props.note)} />}
            {ui.modal.isOpen && ui.modal.type === 'settings' && <SettingsModal isOpen={true} onClose={closeModal} onExport={handleExport} onImport={importData} />}
            {ui.modal.isOpen && ui.modal.type === 'help' && <HelpCenter isOpen={true} onClose={closeModal} />}
            {ui.modal.isOpen && ui.modal.type === 'commandPalette' && <CommandPalette isOpen={true} onClose={closeModal} notes={notes} activeNote={activeNote} onSelectNote={handleSelectNote} onAddNote={handleAddNote} onToggleTheme={() => setTheme(theme==='light'?'dark':'light')} onShowSettings={() => openModal({type:'settings'})} onShowHelp={() => openModal({type:'help'})} onTriggerAiAgent={(name) => { 
                setRightSidebarView('ai'); 
                setSidebarOpen(true); 
                addToast({message: t('toast.aiAgentTriggered', { agentName: name }), type:'info'}); 
                closeModal();
            }} />}
        </>
    )
}

const AppContent: React.FC = () => {
  const logic = useAppLogic();
  const { settings, ui, activeNoteId, setSidebarOpen, activeNote, allNotes, handleSelectNote, handleAddNote, notes, setActiveNoteId, toasts } = logic;

  const densityClasses: Record<string, string> = {
    compact: 'density-compact',
    comfortable: 'density-comfortable',
    default: '',
  };

  const fontClasses: Record<string, string> = {
      'system-ui': 'font-sans',
      'serif': 'font-serif',
      'monospace': 'font-mono',
  }

  return (
      <AppContext.Provider value={logic}>
        <div className={`
            h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 
            ${settings.reduceMotion ? 'reduce-motion' : ''}
            ${densityClasses[settings.density] || ''}
            ${fontClasses[settings.font] || 'font-sans'}
            overflow-hidden fixed inset-0
        `}>
            <div className="flex flex-1 overflow-hidden relative">
                <LeftSidebar />
                <MainContent />

                {/* Backdrop */}
                {ui.isSidebarOpen && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />
                )}

                {/* Right Sidebar */}
                <div className={`fixed top-0 right-0 h-full w-4/5 md:w-1/3 md:max-w-md z-30 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl md:shadow-none transition-transform duration-300 ${ui.isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 md:z-auto`}>
                    <MemoizedRightSidebar activeNote={activeNote} notes={allNotes} onSelectNote={handleSelectNote} onClose={() => setSidebarOpen(false)} />
                </div>
            </div>
            
            <BottomNavbar 
                onNavigate={(view) => {
                    if(view === 'list') { setActiveNoteId(null); setSidebarOpen(false); }
                    else if (view === 'sidebar') { if(!activeNoteId && notes.length) setActiveNoteId(notes[0].id); setSidebarOpen(true); }
                }}
                onAddNote={() => handleAddNote()}
                activeView={ui.isSidebarOpen ? 'sidebar' : (activeNoteId ? 'editor' : 'list')}
            />

            <GlobalModals />
            
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
                {toasts.map(toast => (
                    <div className="pointer-events-auto" key={toast.id}>
                        <Toast toast={toast} onClose={() => {/* Handled by Redux */}} duration={toast.duration} />
                    </div>
                ))}
            </div>
        </div>
      </AppContext.Provider>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <LocaleProvider>
        <AppContent />
    </LocaleProvider>
  </ThemeProvider>
);

export default App;
