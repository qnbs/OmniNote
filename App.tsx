
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Note, ImportData, AppSettings, Template } from './types';
import NoteList from './components/NoteList';
import NoteEditor, { NoteEditorHandle } from './components/NoteEditor';
import RightSidebar from './components/RightSidebar';
import { ThemeProvider, useTheme, ThemeToggle } from './components/ThemeProvider';
import { BrainCircuit, BookOpenCheck, Settings, Notebook, CheckSquare, LayoutTemplate, HelpCircle, Command } from './components/icons';
import BottomNavbar from './components/BottomNavbar';
import { NoteProvider, useNotes } from './contexts/NoteContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import TaskView from './components/TaskView';
import TemplateView from './components/TemplateView';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { LocaleProvider, useLocale } from './contexts/LocaleContext';

const MemoizedRightSidebar = React.memo(RightSidebar);

const AppContent: React.FC = () => {
  const { notes, templates, addNote, deleteNote, importData, togglePinNote } = useNotes();
  const { addToast } = useToast();
  const { settings } = useSettings();
  const { showModal, hideModal } = useModal();
  const { t } = useLocale();
  const { theme, setTheme } = useTheme();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [leftSidebarView, setLeftSidebarView] = useState<'notes' | 'tasks' | 'templates'>('notes');

  const editorRef = useRef<NoteEditorHandle>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);
  
  const activeNote = useMemo(() => notes.find(note => note.id === activeNoteId) || null, [notes, activeNoteId]);

  useEffect(() => {
    if (activeNote) {
      document.title = `${activeNote.title} - OmniNote`;
    } else {
      document.title = t('appTitle');
    }
  }, [activeNote, t]);

  const handleSelectNote = useCallback((id: string) => {
    setActiveNoteId(id);
    setLeftSidebarView('notes');
    if (window.innerWidth < 768) {
      setSidebarOpen(false); // On mobile, close sidebar when switching notes to show editor
    }
  }, []);

  const handleAddNote = useCallback(async (templateContent: string = '', templateTitle: string = t('untitledNote')) => {
    const newNote = await addNote(templateTitle, templateContent);
    setActiveNoteId(newNote.id);
    setLeftSidebarView('notes');
    if(window.innerWidth < 768) {
      setSidebarOpen(false);
    } else {
        setTimeout(() => {
            editorRef.current?.focusTitle();
        }, 100);
    }
    return newNote;
  }, [addNote, t]);
  
  const handleShowCommandPalette = useCallback(() => {
    showModal('commandPalette', {
        notes,
        activeNote,
        onClose: hideModal,
        onSelectNote: (noteId: string) => {
            handleSelectNote(noteId);
            hideModal();
        },
        onAddNote: async () => {
            hideModal();
            const newNote = await handleAddNote();
            handleSelectNote(newNote.id);
        },
        onToggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light'),
        onShowSettings: () => {
            hideModal();
            // Defined below, but we need to declare the function before the dependency array
            handleShowSettings();
        },
        onShowHelp: () => {
            hideModal();
             // Defined below, but we need to declare the function before the dependency array
            handleShowHelp();
        },
        onTriggerAiAgent: (agentName: string) => {
            setSidebarOpen(true);
            addToast(t('toast.aiAgentTriggered', { agentName }), 'info');
            hideModal();
        }
    });
  }, [showModal, hideModal, notes, activeNote, handleSelectNote, handleAddNote, setTheme, theme, addToast, t]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // New Note Shortcut
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        handleAddNote();
      }
      // Command Palette Shortcut
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleShowCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddNote, handleShowCommandPalette]);
  
  const confirmDelete = useCallback((noteToDelete: Note) => {
    const notesForIndex = searchQuery ? filteredNotes : notes;
    const noteToDeleteIndex = notesForIndex.findIndex(n => n.id === noteToDelete.id);

    if (noteToDeleteIndex === -1) {
        deleteNote(noteToDelete.id);
        hideModal();
        addToast(t('toast.noteDeleted'), 'success');
        return;
    }

    let nextActiveId: string | null = null;
    if (activeNoteId === noteToDelete.id) {
      const potentialNextNotes = notesForIndex.filter(n => n.id !== noteToDelete.id);
      if (potentialNextNotes.length > 0) {
        const nextIndex = Math.min(noteToDeleteIndex, potentialNextNotes.length - 1);
        nextActiveId = potentialNextNotes[nextIndex].id;
      }
    }
    
    deleteNote(noteToDelete.id);

    if (activeNoteId === noteToDelete.id) {
        setActiveNoteId(nextActiveId);
    }

    hideModal();
    addToast(t('toast.noteDeleted'), 'success');
  }, [activeNoteId, deleteNote, filteredNotes, notes, addToast, searchQuery, hideModal, t]);


  const handleDeleteRequest = useCallback((note: Note, triggerElement: HTMLElement) => {
    showModal('deleteConfirm', {
        note: note,
        onConfirm: () => confirmDelete(note),
        onClose: () => {
            hideModal();
            triggerElement.focus();
        },
    });
  }, [showModal, hideModal, confirmDelete]);
  
  const handleTogglePin = useCallback((id: string) => {
    togglePinNote(id);
  }, [togglePinNote]);
  
  const activeMobileView = isSidebarOpen ? 'sidebar' : (activeNoteId ? 'editor' : 'list');

  const handleMobileNavigate = useCallback((view: 'list' | 'sidebar') => {
    if (view === 'list') {
      setActiveNoteId(null);
      setSidebarOpen(false);
    } else if (view === 'sidebar') {
      if (!activeNoteId && notes.length > 0) {
        setActiveNoteId(notes[0].id);
      }
      setSidebarOpen(true);
    }
  }, [activeNoteId, notes]);

  const handleExport = useCallback((exportType: 'all' | 'notes' | 'templates' | 'settings') => {
    try {
        let dataToExport: ImportData = {};
        let filename = `omninote_backup_${new Date().toISOString().split('T')[0]}.json`;

        switch(exportType) {
            case 'all':
                dataToExport = { notes, templates, settings };
                break;
            case 'notes':
                dataToExport = { notes };
                filename = 'omninote_notes_export.json';
                break;
            case 'templates':
                 dataToExport = { templates };
                 filename = 'omninote_templates_export.json';
                 break;
            case 'settings':
                dataToExport = { settings };
                filename = 'omninote_settings_export.json';
                break;
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
      addToast(t('toast.exportSuccess'), 'success');
    } catch (error) {
      console.error('Export failed:', error);
      addToast(t('toast.exportFailed'), 'error');
    }
  }, [notes, templates, settings, addToast, t]);

  const handleImport = useCallback((data: ImportData) => {
    importData(data);
    hideModal();
  }, [importData, hideModal]);

  const handleShowSettings = useCallback(() => {
      showModal('settings', {
          onExport: handleExport,
          onImport: handleImport,
          onClose: () => {
              hideModal();
              settingsButtonRef.current?.focus();
          }
      });
  }, [handleExport, handleImport, showModal, hideModal]);

  const handleShowHelp = useCallback(() => {
    showModal('help', {
        onClose: () => {
            hideModal();
            helpButtonRef.current?.focus();
        }
    });
  }, [showModal, hideModal]);
  
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
      <div className={`
        h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 
        ${settings.reduceMotion ? 'reduce-motion' : ''}
        ${densityClasses[settings.density] || ''}
        ${fontClasses[settings.font] || 'font-sans'}
        overflow-hidden fixed inset-0
      `}>
        <style>{`
            .reduce-motion * {
                transition: none !important;
                animation: none !important;
            }
        `}</style>
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar */}
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
                <button onClick={handleShowCommandPalette} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" aria-label={t('commandPalette.title')} title={t('commandPalette.title')}>
                    <Command className="h-5 w-5" />
                </button>
                <button ref={helpButtonRef} onClick={handleShowHelp} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" aria-label={t('help.title')} title={t('help.title')}>
                  <HelpCircle className="h-5 w-5" />
                </button>
                <button ref={settingsButtonRef} onClick={handleShowSettings} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" aria-label={t('settings.title')} title={t('settings.title')}>
                  <Settings className="h-5 w-5" />
                </button>
                <ThemeToggle />
              </div>
            </div>
            
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
                    <button
                        onClick={() => setLeftSidebarView('notes')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        leftSidebarView === 'notes' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <Notebook className="h-3.5 w-3.5" />
                        {t('sidebar.notes')}
                    </button>
                    <button
                        onClick={() => setLeftSidebarView('tasks')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        leftSidebarView === 'tasks' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <CheckSquare className="h-3.5 w-3.5" />
                        {t('sidebar.tasks')}
                    </button>
                     <button
                        onClick={() => setLeftSidebarView('templates')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        leftSidebarView === 'templates' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <LayoutTemplate className="h-3.5 w-3.5" />
                        {t('sidebar.templates')}
                    </button>
                </div>
            </div>

            {leftSidebarView === 'notes' && (
                <NoteList
                    notes={filteredNotes}
                    activeNoteId={activeNoteId}
                    onSelectNote={handleSelectNote}
                    onAddNote={handleAddNote}
                    onDeleteNote={handleDeleteRequest}
                    onTogglePin={handleTogglePin}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            )}
            {leftSidebarView === 'tasks' && (
                <TaskView onSelectNote={handleSelectNote} />
            )}
            {leftSidebarView === 'templates' && (
                 <TemplateView
                    onUseTemplate={(content, title) => handleAddNote(content, `${t('newFromTemplatePrefix')} ${title}`)}
                  />
            )}
          </div>

          {/* Main Content */}
          <main className={`
            flex-1 flex-col w-full
            ${activeNoteId ? 'flex' : 'hidden md:flex'}
            relative z-0 bg-white dark:bg-slate-950 transition-colors duration-300
          `}>
            {activeNote ? (
              <NoteEditor
                ref={editorRef}
                key={activeNote.id}
                note={activeNote}
                allNotes={notes}
                onSelectNote={handleSelectNote}
              />
            ) : (
              <div className="hidden items-center justify-center h-full text-slate-400 dark:text-slate-600 md:flex bg-slate-50/30 dark:bg-slate-900/20">
                <div className="text-center max-w-md px-6">
                  <div className="mx-auto h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <BookOpenCheck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">{t('editor.selectNote')}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">{t('editor.or')}</p>
                  
                  <button 
                    onClick={() => handleAddNote()}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 active:scale-95"
                  >
                    {t('editor.createNewNote')}
                  </button>
                   <p className="mt-8 text-xs text-slate-400">
                    {t('commandPalette.tip.text1')} <kbd className="px-2 py-1 mx-1 text-[10px] font-bold text-slate-500 bg-slate-200 border border-slate-300 rounded dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">{t('commandPalette.tip.kbd')}</kbd> {t('commandPalette.tip.text2')}
                   </p>
                </div>
              </div>
            )}
          </main>

          {/* Backdrop for Right Sidebar on Mobile */}
          {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />
          )}

          {/* Right Sidebar */}
          <div className={`
              fixed top-0 right-0 h-full w-4/5 md:w-1/3 md:max-w-md z-30
              bg-slate-50 dark:bg-slate-900
              border-l border-slate-200 dark:border-slate-800 shadow-2xl md:shadow-none
              transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              md:relative md:translate-x-0 md:z-auto
              ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
            <MemoizedRightSidebar 
              activeNote={activeNote} 
              notes={notes} 
              onSelectNote={handleSelectNote} 
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
        
        <BottomNavbar 
          onNavigate={handleMobileNavigate}
          onAddNote={() => handleAddNote()}
          activeView={activeMobileView}
        />
      </div>
  );
};


const App: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
        <LocaleProvider>
          <SettingsProvider>
            <NoteProvider>
                <ModalProvider>
                <AppContent />
                </ModalProvider>
            </NoteProvider>
          </SettingsProvider>
        </LocaleProvider>
    </ToastProvider>
  </ThemeProvider>
);

export default App;