# OmniNote Quellcode-Dokumentation

Dieses Dokument enthält die vollständige Verzeichnisstruktur und den gesamten Quellcode für die OmniNote-Anwendung.

## Verzeichnisstruktur

```
.
├── components
│   ├── AiAgentPanel.tsx
│   ├── BottomNavbar.tsx
│   ├── CommandPalette.tsx
│   ├── ConfirmDeleteModal.tsx
│   ├── HelpCenter.tsx
│   ├── IconPicker.tsx
│   ├── icons.tsx
│   ├── KnowledgeGraph.tsx
│   ├── NoteEditor.tsx
│   ├── NoteEditorToolbar.tsx
│   ├── NoteList.tsx
│   ├── NoteListItem.tsx
│   ├── RightSidebar.tsx
│   ├── SearchNotes.tsx
│   ├── SettingsModal.tsx
│   ├── TaskView.tsx
│   ├── TemplateView.tsx
│   ├── ThemeProvider.tsx
│   ├── Toast.tsx
│   └── VersionHistory.tsx
├── contexts
│   ├── LocaleContext.tsx
│   ├── ModalContext.tsx
│   ├── NoteContext.tsx
│   ├── SettingsContext.tsx
│   └── ToastContext.tsx
├── locales
│   ├── de.json
│   └── en.json
├── services
│   └── geminiService.ts
├── utils
│   ├── initialData.ts
│   └── noteUtils.ts
├── App.tsx
├── index.html
├── index.tsx
├── metadata.json
└── types.ts
```

---

## Quellcode der Dateien

### `index.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### `metadata.json`

```json
{
  "name": "OmniNote",
  "description": "OmniNote is a revolutionary application that combines multi-functional note and text management with an orchestrated AI agent swarm. Your thoughts, intelligently organized, available everywhere.",
  "requestFramePermissions": []
}
```

---

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OmniNote - AI-Powered Notes</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              'primary': {
                '50': '#f0f9ff',
                '100': '#e0f2fe',
                '200': '#bae6fd',
                '300': '#7dd3fc',
                '400': '#38bdf8',
                '500': '#0ea5e9',
                '600': '#0284c7',
                '700': '#0369a1',
                '800': '#075985',
                '900': '#0c4a6e',
                '950': '#082f49',
              },
            }
          }
        }
      }
    </script>
    <style>
        /* Define density classes here to avoid FOUC */
        .density-compact .compact-py { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .density-compact .compact-px { padding-left: 0.5rem; padding-right: 0.5rem; }
        .density-compact .compact-gap { gap: 0.25rem; }
        .density-compact .compact-text { font-size: 0.8rem; }

        .density-comfortable .comfortable-py { padding-top: 1rem; padding-bottom: 1rem; }
        .density-comfortable .comfortable-px { padding-left: 1.25rem; padding-right: 1.25rem; }
        .density-comfortable .comfortable-gap { gap: 0.75rem; }
        .density-comfortable .comfortable-text { font-size: 1.05rem; }

        .font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        
        /* A11y: Add a consistent, high-contrast focus ring for keyboard users */
        *:focus-visible {
            outline: 2px solid #0ea5e9; /* primary-500 */
            outline-offset: 2px;
            border-radius: 4px;
        }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.1.1",
    "react-dom/": "https://esm.sh/react-dom@^19.1.1/",
    "react/": "https://esm.sh/react@^19.1.1/",
    "@google/genai": "https://esm.sh/@google/genai@^1.14.0",
    "d3": "https://esm.sh/d3@^7.9.0",
    "lucide-react": "https://esm.sh/lucide-react@^0.539.0",
    "marked": "https://esm.sh/marked@^14.0.0",
    "dompurify": "https://esm.sh/dompurify@^3.1.6",
    "react-dom": "https://esm.sh/react-dom@^19.1.1",
    "d3-force": "https://esm.sh/d3-force@^3.0.0",
    "d3-selection": "https://esm.sh/d3-selection@^3.0.0",
    "d3-drag": "https://esm.sh/d3-drag@^3.0.0",
    "d3-zoom": "https://esm.sh/d3-zoom@^3.0.0"
  }
}
</script>
</head>
  <body class="bg-slate-50 dark:bg-slate-900">
    <div id="root"></div>
    <div id="toast-container"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

---

### `App.tsx`

```tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Note } from './types';
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
        let dataToExport: any = {};
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

  const handleImport = useCallback((data: { notes?: Note[], templates?: any[], settings?: any }) => {
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
        h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 
        ${settings.reduceMotion ? 'reduce-motion' : ''}
        ${densityClasses[settings.density] || ''}
        ${fontClasses[settings.font] || 'font-sans'}
      `}>
        <style>{`
            .reduce-motion * {
                transition: none !important;
                animation: none !important;
            }
        `}</style>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className={`
            w-full flex-col border-r border-slate-200 dark:border-slate-800
            md:w-1/4 md:max-w-sm md:flex
            ${activeNoteId ? 'hidden md:flex' : 'flex'}
          `}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 compact-py comfortable-py">
              <div className="flex items-center gap-2">
                  <BrainCircuit className="h-8 w-8 text-primary-500"/>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">OmniNote</h1>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleShowCommandPalette} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" aria-label={t('commandPalette.title')} title={t('commandPalette.title')}>
                    <Command className="h-5 w-5" />
                </button>
                <button ref={helpButtonRef} onClick={handleShowHelp} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" aria-label={t('help.title')} title={t('help.title')}>
                  <HelpCircle className="h-5 w-5" />
                </button>
                <button ref={settingsButtonRef} onClick={handleShowSettings} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" aria-label={t('settings.title')} title={t('settings.title')}>
                  <Settings className="h-5 w-5" />
                </button>
                <ThemeToggle />
              </div>
            </div>
            
            <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex-grow flex justify-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setLeftSidebarView('notes')}
                        className={`w-1/3 py-2 px-4 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                        leftSidebarView === 'notes' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        <Notebook className="h-4 w-4" />
                        {t('sidebar.notes')}
                    </button>
                    <button
                        onClick={() => setLeftSidebarView('tasks')}
                        className={`w-1/3 py-2 px-4 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                        leftSidebarView === 'tasks' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        <CheckSquare className="h-4 w-4" />
                        {t('sidebar.tasks')}
                    </button>
                     <button
                        onClick={() => setLeftSidebarView('templates')}
                        className={`w-1/3 py-2 px-4 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                        leftSidebarView === 'templates' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        <LayoutTemplate className="h-4 w-4" />
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
            flex-1 flex-col
            ${activeNoteId ? 'flex' : 'hidden md:flex'}
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
              <div className="hidden items-center justify-center h-full text-slate-500 md:flex">
                <div className="text-center">
                  <BookOpenCheck className="mx-auto h-16 w-16 text-slate-400" />
                  <p className="mt-4 text-xl font-semibold">{t('editor.selectNote')}</p>

                  <p className="mt-2 text-slate-400">{t('editor.or')}</p>
                  <button 
                    onClick={() => handleAddNote()}
                    className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
                  >
                    {t('editor.createNewNote')}
                  </button>
                   <p className="mt-6 text-sm text-slate-400">
                    {t('commandPalette.tip.text1')} <kbd className="px-2 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-md dark:bg-slate-600 dark:text-slate-100 dark:border-slate-500">{t('commandPalette.tip.kbd')}</kbd> {t('commandPalette.tip.text2')}
                   </p>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <div className={`
              fixed top-0 right-0 h-full w-full z-30
              bg-slate-50 dark:bg-slate-950
              border-l border-slate-200 dark:border-slate-800
              transition-transform duration-300 ease-in-out
              md:relative md:w-1/3 md:max-w-md md:translate-x-0 md:z-auto
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
```

---

### `types.ts`

```ts
export interface NoteHistory {
  content: string;
  updatedAt: string;
}
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  history: NoteHistory[];
  icon?: string;
}

export interface Template {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

export interface TagSuggestion {
  tags: string[];
}

export interface SummarySuggestion {
  summary: string;
}

export interface BrainstormSuggestion {
  ideas: string[];
}

export interface PlannerSuggestion {
  tasks: string[];
}

export interface ResearchSource {
    title: string;
    uri: string;
}

export interface ResearchSuggestion {
    answer: string;
    sources: ResearchSource[];
}

export interface TranslateSuggestion {
  translatedText: string;
}

export interface FormatSuggestion {
  formattedText: string;
}

export interface ImageSuggestion {
  imageBytes: string;
}

export interface AiRecipeResult {
    title: string;
    content: string;
    tags?: string[];
}

export interface GraphNode {
  id: string;
  title:string;
  radius: number;
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    index?: number;
    type?: 'tag' | 'explicit';
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  noteId: string;
  noteTitle: string;
  rawLine: string;
  lineIndex: number;
  dueDate?: string;
}

// --- App Settings Interfaces ---

export interface AiAgentSettings {
    summaryLength: 'short' | 'detailed';
    ideaCount: 3 | 5 | 7;
    planDetail: 'simple' | 'detailed';
    targetLanguage: 'English' | 'German' | 'Spanish' | 'French' | 'Japanese' | 'Chinese';
    imageStyle: 'default' | 'photorealistic' | 'watercolor' | 'anime';
    imageAspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16';
}

export const AVAILABLE_LANGUAGES: { value: AiAgentSettings['targetLanguage'], labelKey: string }[] = [
    { value: 'English', labelKey: 'languages.english' },
    { value: 'German', labelKey: 'languages.german' },
    { value: 'Spanish', labelKey: 'languages.spanish' },
    { value: 'French', labelKey: 'languages.french' },
    { value: 'Japanese', labelKey: 'languages.japanese' },
    { value: 'Chinese', labelKey: 'languages.chinese' }
];

export interface AppSettings {
    density: 'compact' | 'default' | 'comfortable';
    font: 'system-ui' | 'serif' | 'monospace';
    reduceMotion: boolean;
    // Editor settings
    editorFontSize: 'small' | 'medium' | 'large';
    focusMode: boolean;
    autoSaveDelay: 1500 | 3000 | 5000;
    showWordCount: boolean;
    defaultEditorView: 'edit' | 'preview';
    // AI settings
    aiAgentDefaults: AiAgentSettings;
}
```

---

### `components/NoteList.tsx`

```tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
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
                    className="flex-grow flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-l-md hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {t('noteList.newNote')}
                  </button>
                  <button onClick={() => setIsOpen(!isOpen)} className="px-2 bg-primary-700 text-white rounded-r-md hover:bg-primary-800">
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
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                           <LayoutTemplate className="h-4 w-4" /> <span>{template.title}</span>
                        </button>
                    ))}
                    {templates.length === 0 && <div className="p-2 text-sm text-slate-500">{t('noteList.noTemplates')}</div>}
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
  
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
  }

  const handleSelectNoteItem = (id: string) => {
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
  }

  const handleBatchDelete = () => {
      batchDelete(Array.from(selectedIds));
      addToast(t('toast.batchDeleteSuccess', { count: selectedIds.size }), 'success');
      toggleSelectMode();
  }
  
  const handleBatchPin = (pin: boolean) => {
      batchTogglePin(Array.from(selectedIds), pin);
      addToast(pin ? t('toast.batchPinSuccess', { count: selectedIds.size }) : t('toast.batchUnpinSuccess', { count: selectedIds.size }), 'success');
      toggleSelectMode();
  }

  const handleBatchAddTag = () => {
    const tag = tagInputRef.current?.value;
    if (tag && tag.trim() !== '') {
        batchAddTag(Array.from(selectedIds), tag.trim());
        addToast(t('toast.batchTagSuccess', { count: selectedIds.size, tag: tag.trim() }), 'success');
        toggleSelectMode();
    } else {
        addToast(t('toast.emptyTagError'), 'error');
    }
  }


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
      <div className="p-2 border-b border-slate-200 dark:border-slate-800">
         <NewNoteButton onAddNote={onAddNote} />
      </div>
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <SearchNotes query={searchQuery} onQueryChange={setSearchQuery} />
        <div className="flex items-center justify-between">
            <div>
                <label htmlFor="sort-notes" className="sr-only">{t('noteList.sortBy')}</label>
                <select 
                    id="sort-notes" 
                    value={sortKey} 
                    onChange={e => setSortKey(e.target.value as SortKey)}
                    className="text-xs bg-transparent dark:bg-slate-900 border-none focus:ring-0 text-slate-500"
                >
                    <option value="updatedAt">{t('noteList.sort.updated')}</option>
                    <option value="createdAt">{t('noteList.sort.created')}</option>
                    <option value="title">{t('noteList.sort.title')}</option>
                </select>
            </div>
            <button onClick={toggleSelectMode} className="text-xs font-semibold text-primary-600 dark:text-primary-400 px-2 py-1 rounded-md hover:bg-primary-100/50 dark:hover:bg-primary-900/50">
                {isSelectMode ? t('cancel') : t('noteList.select')}
            </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notes.length > 0 ? (
          <>
            {pinnedNotes.length > 0 && (
                <div>
                    <h2 className="px-4 pt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('noteList.pinned')}</h2>
                    {renderNoteList(pinnedNotes)}
                </div>
            )}
             {pinnedNotes.length > 0 && unpinnedNotes.length > 0 && <div className="mx-4 my-2 border-t border-slate-200 dark:border-slate-800"></div>}
            {unpinnedNotes.length > 0 && (
                <div>
                     {pinnedNotes.length > 0 && <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('noteList.notes')}</h2>}
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
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg">
             <div className="text-sm font-semibold mb-2">{t('noteList.batch.selected', { count: selectedIds.size })}</div>
             <div className="space-y-2">
                 <div className="flex items-center gap-2">
                    <input ref={tagInputRef} type="text" placeholder={t('noteList.batch.addTagPlaceholder')} className="flex-grow w-full text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1"/>
                    <button onClick={handleBatchAddTag} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200"><Tag className="h-4 w-4"/></button>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleBatchPin(true)} className="flex items-center justify-center gap-1 text-xs px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><Pin className="h-3 w-3"/>{t('noteList.batch.pin')}</button>
                    <button onClick={() => handleBatchPin(false)} className="flex items-center justify-center gap-1 text-xs px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><PinOff className="h-3 w-3"/>{t('noteList.batch.unpin')}</button>
                    <button onClick={handleBatchDelete} className="flex items-center justify-center gap-1 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900"><Trash2 className="h-3 w-3"/>{t('delete')}</button>
                 </div>
             </div>
        </div>
       )}
    </div>
  );
};

export default React.memo(NoteList);
```

---

### `components/NoteEditor.tsx`

```tsx
import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Note } from '../types';
import { Eye, Pencil, Save, SmilePlus, ChevronDown, FileDown } from './icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNotes } from '../contexts/NoteContext';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import NoteEditorToolbar from './NoteEditorToolbar';
import IconPicker from './IconPicker';
import { useLocale } from '../contexts/LocaleContext';
import { WIKI_LINK_REGEX, findNoteByTitle } from '../utils/noteUtils';

declare const hljs: any;

export interface NoteEditorHandle {
  focusTitle: () => void;
}

interface NoteEditorProps {
  note: Note;
  allNotes: Note[];
  onSelectNote: (id: string) => void;
}

const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(({ note, allNotes, onSelectNote }, ref) => {
  const { updateNote, addTemplate } = useNotes();
  const { addToast } = useToast();
  const { settings } = useSettings();
  const { t, locale } = useLocale();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(settings.defaultEditorView);
  const [isIconPickerOpen, setIconPickerOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [debouncedContent, setDebouncedContent] = useState(content);
  const isSyncingScrollRef = useRef(false);


  useImperativeHandle(ref, () => ({
    focusTitle: () => {
      titleRef.current?.focus();
      titleRef.current?.select();
    },
  }));

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setViewMode(settings.defaultEditorView);
  }, [note, settings.defaultEditorView]);
  
  useEffect(() => {
    const identifier = setTimeout(() => {
      setDebouncedContent(content);
    }, 300);
    return () => clearTimeout(identifier);
  }, [content]);

   useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


  const handleUpdate = useCallback((updatedFields: Partial<Note>) => {
      const newNote = { ...note, ...updatedFields };
      if (JSON.stringify(newNote) !== JSON.stringify(note)) {
          updateNote(newNote);
          addToast(t('toast.noteSaved'), 'success', 1000);
      }
  }, [note, updateNote, addToast, t]);

  useEffect(() => {
    const identifier = setTimeout(() => {
        if (title !== note.title || content !== note.content) {
            handleUpdate({ title, content });
        }
    }, settings.autoSaveDelay);
    return () => clearTimeout(identifier);
  }, [title, content, handleUpdate, settings.autoSaveDelay, note.title, note.content]);


  const handleIconSelect = (iconName: string) => {
    updateNote({ ...note, icon: iconName });
    setIconPickerOpen(false);
  }

  const handleSaveAsTemplate = () => {
    addTemplate(note);
    addToast(t('toast.templateSaved', { title: note.title }), 'success');
    setMenuOpen(false);
  }

   const handleExportMarkdown = () => {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${filename || 'note'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMenuOpen(false);
    };

  useEffect(() => {
    if (viewMode === 'preview' && previewRef.current) {
        // Syntax highlighting
        if(typeof hljs !== 'undefined') {
            previewRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }

        // Wiki-link click handler
        const handlePreviewClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a[data-note-id]');
            if (link) {
                e.preventDefault();
                const targetNoteId = link.getAttribute('data-note-id');
                if (targetNoteId) {
                    onSelectNote(targetNoteId);
                }
            }
        };

        const currentPreviewRef = previewRef.current;
        currentPreviewRef.addEventListener('click', handlePreviewClick);
        return () => {
            currentPreviewRef.removeEventListener('click', handlePreviewClick);
        };
    }
  }, [debouncedContent, viewMode, onSelectNote, settings.font, settings.editorFontSize]);


  const parsedContent = useMemo(() => {
      const rawHtml = marked.parse(debouncedContent) as string;
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);
      // After sanitization, replace [[wiki-links]]
      return sanitizedHtml.replace(WIKI_LINK_REGEX, (match, linkTitle) => {
        const linkedNote = findNoteByTitle(allNotes, linkTitle);
        if (linkedNote) {
          return `<a href="#" data-note-id="${linkedNote.id}" class="text-primary-600 dark:text-primary-400 bg-primary-100/50 dark:bg-primary-900/50 px-1 py-0.5 rounded-md hover:underline">${linkTitle}</a>`;
        } else {
          return `<span class="text-red-500 bg-red-100/50 dark:bg-red-900/50 px-1 py-0.5 rounded-md" title="${t('editor.brokenLinkTitle')}">${linkTitle}</span>`;
        }
      });
  }, [debouncedContent, allNotes, t]);
  
  const fontClasses: Record<string, string> = {
      'system-ui': 'font-sans',
      'serif': 'font-serif',
      'monospace': 'font-mono',
  }
  
  const fontSizeClasses: Record<string, string> = {
      'small': 'text-sm',
      'medium': 'text-base',
      'large': 'text-lg',
  }

  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);
  const charCount = useMemo(() => content.length, [content]);
  
  const formattedDate = useMemo(() => {
    try {
      return new Date(note.updatedAt).toLocaleString(locale);
    } catch (e) {
      return 'Invalid Date';
    }
  }, [note.updatedAt, locale]);

  const syncScroll = (source: 'editor' | 'preview') => {
    if (isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;

    const editor = contentRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    if (source === 'editor') {
        const scrollableDist = editor.scrollHeight - editor.clientHeight;
        if (scrollableDist <= 0) return;
        const scrollPercent = editor.scrollTop / scrollableDist;
        preview.scrollTop = scrollPercent * (preview.scrollHeight - preview.clientHeight);
    } else {
        const scrollableDist = preview.scrollHeight - preview.clientHeight;
        if (scrollableDist <= 0) return;
        const scrollPercent = preview.scrollTop / scrollableDist;
        editor.scrollTop = scrollPercent * (editor.scrollHeight - editor.clientHeight);
    }

    setTimeout(() => {
        isSyncingScrollRef.current = false;
    }, 100);
  };
  
  const applyMarkdown = useCallback((syntax: { prefix: string; suffix?: string; placeholder?: string }) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const placeholder = syntax.placeholder || 'text';
    const textToInsert = selectedText || placeholder;
    
    const newText = `${value.substring(0, selectionStart)}${syntax.prefix}${textToInsert}${syntax.suffix || ''}${value.substring(selectionEnd)}`;
    
    setContent(newText);
    
    setTimeout(() => {
        textarea.focus();
        if (selectedText) {
            textarea.setSelectionRange(selectionStart + syntax.prefix.length, selectionEnd + syntax.prefix.length);
        } else {
            textarea.setSelectionRange(selectionStart + syntax.prefix.length, selectionStart + syntax.prefix.length + placeholder.length);
        }
    }, 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const isEditorFocused = document.activeElement === contentRef.current || document.activeElement === titleRef.current;
        if (!isEditorFocused) return;
        
        const isModifier = event.metaKey || event.ctrlKey;
        
        if (isModifier && event.key.toLowerCase() === 'enter') {
            event.preventDefault();
            setViewMode(prev => prev === 'edit' ? 'preview' : 'edit');
        }
        if (isModifier && event.key.toLowerCase() === 'b') {
            event.preventDefault();
            applyMarkdown({ prefix: '**', suffix: '**', placeholder: 'bold text' });
        }
        if (isModifier && event.key.toLowerCase() === 'i') {
            event.preventDefault();
            applyMarkdown({ prefix: '*', suffix: '*', placeholder: 'italic text' });
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [applyMarkdown]);



  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950">
      <div className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 overflow-y-auto">
        <div className='flex justify-between items-center mb-4 gap-4'>
            <div className="relative">
                 <button 
                    onClick={() => setIconPickerOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 absolute -left-12 top-1/2 -translate-y-1/2"
                    aria-label={t('editor.chooseIcon')}
                  >
                     <SmilePlus className="h-6 w-6 text-slate-500" />
                 </button>
                 {isIconPickerOpen && <IconPicker onSelect={handleIconSelect} onClose={() => setIconPickerOpen(false)} />}
            </div>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('editor.titlePlaceholder')}
            className={`note-editor-title w-full text-3xl font-bold bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700 transition-colors py-2 text-slate-900 dark:text-white ${fontClasses[settings.font]}`}
          />
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg ml-auto">
            <button
              onClick={() => setViewMode('edit')}
              aria-pressed={viewMode === 'edit'}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'edit' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
            >
              <Pencil className="h-4 w-4" /> {t('editor.edit')}
            </button>
            <button
              onClick={() => setViewMode('preview')}
              aria-pressed={viewMode === 'preview'}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
            >
              <Eye className="h-4 w-4" /> {t('editor.preview')}
            </button>
          </div>
           <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!isMenuOpen)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ChevronDown className={`h-5 w-5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700 z-10">
                        <button onClick={handleSaveAsTemplate} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                            <Save className="h-4 w-4" /> {t('editor.saveAsTemplate')}
                        </button>
                        <button onClick={handleExportMarkdown} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                            <FileDown className="h-4 w-4" /> {t('editor.exportMarkdown')}
                        </button>
                    </div>
                )}
            </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'edit' ? (
            <div className="flex-1 flex flex-col">
              <NoteEditorToolbar
                onApplyMarkdown={applyMarkdown}
              />
              <textarea
                ref={contentRef}
                value={content}
                onScroll={() => syncScroll('editor')}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('editor.contentPlaceholder')}
                className={`
                    w-full h-full bg-transparent focus:outline-none resize-none leading-relaxed mt-2 overflow-y-auto
                    ${fontClasses[settings.font]}
                    ${fontSizeClasses[settings.editorFontSize]}
                    ${settings.focusMode ? 'focus-mode' : ''}
                `}
                aria-label={t('editor.contentAriaLabel')}
              />
              <style>{`
                .focus-mode:focus {
                    color: inherit;
                }
                .focus-mode {
                    color: gray;
                }
              `}</style>
            </div>
          ) : (
            <div
              ref={previewRef}
              onScroll={() => syncScroll('preview')}
              className={`prose prose-slate dark:prose-invert max-w-none p-1 overflow-y-auto h-full ${fontClasses[settings.font]} ${fontSizeClasses[settings.editorFontSize]}`}
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          )}
        </div>
        {settings.showWordCount && (
            <div className="mt-4 flex justify-end items-center text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                <span>{t('editor.words')}: {wordCount}</span>
                <span className="mx-2">|</span>
                <span>{t('editor.characters')}: {charCount}</span>
                <span className="mx-2">|</span>
                <span>{t('editor.lastUpdated')}: {formattedDate}</span>
            </div>
        )}
      </div>
    </div>
  );
});

export default NoteEditor;
```

---

### `components/RightSidebar.tsx`

```tsx
import React, { useState } from 'react';
import { Note } from '../types';
import AiAgentPanel from './AiAgentPanel';
import KnowledgeGraph from './KnowledgeGraph';
import VersionHistory from './VersionHistory';
import { BrainCircuit, Share2, History, X } from './icons';
import { useTheme } from './ThemeProvider';
import { useNotes } from '../contexts/NoteContext';
import { useLocale } from '../contexts/LocaleContext';

type ViewMode = 'ai' | 'graph' | 'history';

interface RightSidebarProps {
  activeNote: Note | null;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onClose: () => void;
}

const Slider: React.FC<{label: string, value: number, min: number, max: number, step: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ label, ...props}) => (
    <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
        <input type="range" {...props} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"/>
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
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-semibold text-sm">{t('rightSidebar.graphSettings')}</h4>
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


const RightSidebar: React.FC<RightSidebarProps> = ({ activeNote, notes, onSelectNote, onClose }) => {
  const [view, setView] = useState<ViewMode>('ai');
  const [charge, setCharge] = useState(-400);
  const [linkDistance, setLinkDistance] = useState(120);
  const { theme } = useTheme();
  const { updateNote } = useNotes();
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-4 p-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 md:hidden" aria-label={t('rightSidebar.close')} title={t('rightSidebar.close')}>
          <X className="h-6 w-6" />
        </button>
        <div className="flex-grow flex justify-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
          {TABS.map(tab => (
            <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                title={tab.label}
                className={`w-1/3 py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                view === tab.id ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'
                }`}
            >
                {tab.icon}
                <span className="hidden lg:inline">{tab.label}</span>
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

      <div className="flex-1 overflow-y-auto">
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
            onRestore={(content) => activeNote && updateNote({ ...activeNote, content })}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(RightSidebar);
```

---

### `components/AiAgentPanel.tsx`

```tsx
import React, { useState, useCallback, useReducer, useRef, useEffect, useMemo } from 'react';
import { Note, TagSuggestion, SummarySuggestion, BrainstormSuggestion, ResearchSuggestion, PlannerSuggestion, TranslateSuggestion, FormatSuggestion, ImageSuggestion, AiRecipeResult, AiAgentSettings, AVAILABLE_LANGUAGES } from '../types';
import * as geminiService from '../services/geminiService';
import { BrainCircuit, Lightbulb, Search, Loader2, AlertTriangle, Plus, Copy, CheckSquare, Settings, Languages, Wand2, Image, Replace, BookCopy, GanttChartSquare, Sparkles, Megaphone, ChevronLeft } from './icons';
import { useToast } from '../contexts/ToastContext';
import { useNotes } from '../contexts/NoteContext';
import { useLocale } from '../contexts/LocaleContext';
import { useSettings } from '../contexts/SettingsContext';

// --- Constants for Agent Configurations ---
const IDEA_COUNTS: AiAgentSettings['ideaCount'][] = [3, 5, 7];

const IMAGE_STYLES: { value: AiAgentSettings['imageStyle'], labelKey: string }[] = [
    { value: 'default', labelKey: 'aiPanel.image.styles.default' },
    { value: 'photorealistic', labelKey: 'aiPanel.image.styles.photorealistic' },
    { value: 'watercolor', labelKey: 'aiPanel.image.styles.watercolor' },
    { value: 'anime', labelKey: 'aiPanel.image.styles.anime' },
];
const IMAGE_ASPECT_RATIOS: AiAgentSettings['imageAspectRatio'][] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const aspectRatioStyles: Record<AiAgentSettings['imageAspectRatio'], string> = {
    '16:9': 'aspect-[16/9]', '9:16': 'aspect-[9/16]', '1:1': 'aspect-square', '4:3': 'aspect-[4/3]', '3:4': 'aspect-[3/4]',
};

// --- State Management with useReducer ---
interface AiPanelState {
  loadingAgent: string | null;
  error: string | null;
  summary: string | null;
  tags: string[] | null;
  ideas: string[] | null;
  plan: string[] | null;
  research: ResearchSuggestion | null;
  translation: TranslateSuggestion | null;
  formatted: FormatSuggestion | null;
  image: ImageSuggestion | null;
  recipeResult: AiRecipeResult | null;
  // Local config state, initialized from global settings
  localConfig: AiAgentSettings;
}

type AiPanelAction =
  | { type: 'RUN_AGENT'; payload: { name: string | null } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'SET_RESULT'; payload: { agent: string; data: any } }
  | { type: 'CLEAR_RESULTS'; payload: { agent: string } }
  | { type: 'SET_LOCAL_CONFIG'; payload: { key: keyof AiAgentSettings; value: any } }
  | { type: 'RESET_LOCAL_CONFIG'; payload: { config: AiAgentSettings } };

function aiPanelReducer(state: AiPanelState, action: AiPanelAction): AiPanelState {
  switch (action.type) {
    case 'RUN_AGENT':
      return { ...state, loadingAgent: action.payload.name, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload.error, loadingAgent: null };
    case 'SET_RESULT':
      switch (action.payload.agent) {
        case 'analysis':
          return { ...state, summary: action.payload.data.summary, tags: action.payload.data.tags };
        case 'brainstorm':
          return { ...state, ideas: action.payload.data.ideas };
        case 'plan':
          return { ...state, plan: action.payload.data.tasks };
        case 'research':
          return { ...state, research: action.payload.data };
        case 'translate':
          return { ...state, translation: action.payload.data };
        case 'format':
          return { ...state, formatted: action.payload.data };
        case 'image':
          return { ...state, image: action.payload.data };
        case 'recipe-blog':
        case 'recipe-meeting':
        case 'recipe-social':
          return { ...state, recipeResult: action.payload.data };
        default:
          return state;
      }
    case 'CLEAR_RESULTS': {
      const { agent } = action.payload;
      const newState = { ...state };
      if (agent === 'summary') newState.summary = null;
      if (agent === 'tags') newState.tags = null;
      if (agent === 'ideas') newState.ideas = null;
      if (agent === 'plan') newState.plan = null;
      if (agent === 'research') newState.research = null;
      if (agent === 'translation') newState.translation = null;
      if (agent === 'formatted') newState.formatted = null;
      if (agent === 'image') newState.image = null;
      if (agent === 'recipeResult') newState.recipeResult = null;
      return newState;
    }
    case 'SET_LOCAL_CONFIG':
      return { ...state, localConfig: { ...state.localConfig, [action.payload.key]: action.payload.value } };
    case 'RESET_LOCAL_CONFIG':
        return {...state, localConfig: action.payload.config };
    default:
      return state;
  }
}

interface AiAgentPanelProps {
  activeNote: Note | null;
}

const Divider = () => <hr className="border-slate-200 dark:border-slate-800" />;

const LoadingPlaceholder: React.FC<{ text: string }> = ({ text }) => (
    <div className="mt-2 flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-sm text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p className="font-semibold">{text}</p>
    </div>
);

const ImagePlaceholder: React.FC<{ aspectRatio: AiAgentSettings['imageAspectRatio'] }> = ({ aspectRatio }) => {
    const { t } = useLocale();
    return (
        <div className={`mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex flex-col items-center justify-center text-slate-500 ${aspectRatioStyles[aspectRatio]}`}>
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-2 text-sm font-semibold">{t('aiPanel.image.generating')}</p>
            <p className="text-xs">{t('aiPanel.image.patience')}</p>
        </div>
    );
};

const StreamingResult: React.FC<{ text: string }> = ({ text }) => (
    <div className="text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md whitespace-pre-wrap font-sans mt-2">
      {text}
      <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1" />
    </div>
);


const AiAgentPanel: React.FC<AiAgentPanelProps> = ({ activeNote }) => {
  const { addToast } = useToast();
  const { updateNote } = useNotes();
  const { settings, setAiSetting } = useSettings();
  
  const initialState: AiPanelState = {
    loadingAgent: null,
    error: null,
    summary: null,
    tags: null,
    ideas: null,
    plan: null,
    research: null,
    translation: null,
    formatted: null,
    image: null,
    recipeResult: null,
    localConfig: settings.aiAgentDefaults,
  };

  const [state, dispatch] = useReducer(aiPanelReducer, initialState);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { t, locale } = useLocale();
  const { loadingAgent, error, summary, tags, ideas, plan, research, translation, formatted, image, recipeResult, localConfig } = state;
  const { summaryLength, ideaCount, planDetail, targetLanguage, imageStyle, imageAspectRatio } = localConfig;
  
  const [streamingText, setStreamingText] = useState('');
  
  const isApiKeySet = !!process.env.API_KEY;

  // Sync local config state if global settings change
  useEffect(() => {
    dispatch({ type: 'RESET_LOCAL_CONFIG', payload: { config: settings.aiAgentDefaults }});
  }, [settings.aiAgentDefaults]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const setConfig = <K extends keyof AiAgentSettings>(key: K, value: AiAgentSettings[K]) => {
      dispatch({ type: 'SET_LOCAL_CONFIG', payload: { key, value } });
      setAiSetting(key, value); // Persist to global settings
  }

  const runAgent = useCallback(async (agentName: string, agentFunction: (onChunk?: (chunk: string) => void) => Promise<any>, stream: boolean = false) => {
    if (!activeNote || !activeNote.content) {
      addToast(t('toast.noteHasNoContent'), 'error');
      return;
    }

    // Centralized result clearing for immediate feedback
    if (agentName === 'analysis') {
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'summary' } });
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'tags' } });
    } else if (agentName === 'brainstorm') {
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'ideas' } });
    } else if (agentName === 'plan') {
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'plan' } });
    } else if (agentName === 'research') {
        dispatch({ type: 'SET_RESULT', payload: { agent: 'research', data: null } });
    } else if (agentName === 'translate') {
        dispatch({ type: 'SET_RESULT', payload: { agent: 'translate', data: null } });
    } else if (agentName === 'format') {
        dispatch({ type: 'SET_RESULT', payload: { agent: 'format', data: null } });
    } else if (agentName === 'image') {
        dispatch({ type: 'SET_RESULT', payload: { agent: 'image', data: null } });
    } else if (agentName.startsWith('recipe-')) {
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'recipeResult' }});
    }

    dispatch({ type: 'RUN_AGENT', payload: { name: agentName } });
    setStreamingText('');
    let finalStreamedText = '';

    try {
      if (stream) {
        await agentFunction((chunk: string) => {
            finalStreamedText += chunk;
            setStreamingText(finalStreamedText);
        });
        // After successful stream, parse the final result
        if (agentName === 'analysis') {
             dispatch({ type: 'SET_RESULT', payload: { agent: agentName, data: { summary: finalStreamedText, tags: [] } } });
         } else if (agentName === 'brainstorm') {
            const ideas = finalStreamedText.split('\n').map(line => line.replace(/^[*-] ?/, '').trim()).filter(Boolean);
            dispatch({ type: 'SET_RESULT', payload: { agent: agentName, data: { ideas } } });
         } else if (agentName === 'plan') {
            const tasks = finalStreamedText.split('\n').map(line => line.replace(/^[*-] ?/, '').trim()).filter(Boolean);
            dispatch({ type: 'SET_RESULT', payload: { agent: agentName, data: { tasks } } });
         }
      } else {
         const result = await agentFunction();
         dispatch({ type: 'SET_RESULT', payload: { agent: agentName, data: result } });
      }
    } catch (e: any) {
      const errorMessage = e.message || t('aiPanel.error.prefix', { agentName });
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
      addToast(errorMessage, 'error');
      console.error(e);
    } finally {
      dispatch({ type: 'RUN_AGENT', payload: { name: null } });
      if(stream) {
         setStreamingText('');
      }
    }
  }, [activeNote, addToast, t]);

  const handleAnalysis = useCallback(async (onChunk?: (chunk: string) => void) => {
    if (!activeNote) return;
    if(onChunk) {
        return await geminiService.getSummaryStream(activeNote.content, { length: summaryLength }, locale, onChunk);
    }
    return await geminiService.getSummaryAndTags(activeNote.content, { length: summaryLength }, locale);
  }, [activeNote, summaryLength, locale]);

  const handleBrainstorm = useCallback(async (onChunk?: (chunk: string) => void) => {
    if (!activeNote) return;
    if(onChunk) {
        return await geminiService.getBrainstormingIdeasStream(activeNote.content, { count: ideaCount }, locale, onChunk);
    }
    return await geminiService.getBrainstormingIdeas(activeNote.content, { count: ideaCount }, locale);
  }, [activeNote, ideaCount, locale]);

  const handlePlan = useCallback(async (onChunk?: (chunk: string) => void) => {
    if (!activeNote) return;
     if(onChunk) {
        return await geminiService.getTaskPlanStream(activeNote.content, { detail: planDetail }, locale, onChunk);
    }
    return await geminiService.getTaskPlan(activeNote.content, { detail: planDetail }, locale);
  }, [activeNote, planDetail, locale]);

  const handleResearch = useCallback(async () => {
    if (!activeNote) return;
    return await geminiService.getResearchLinks(activeNote.content, locale);
  }, [activeNote, locale]);

  const handleTranslate = useCallback(async () => {
    if (!activeNote) return;
    return await geminiService.translateNote(activeNote.content, targetLanguage);
  }, [activeNote, targetLanguage]);
  
  const handleFormat = useCallback(async () => {
    if (!activeNote) return;
    return await geminiService.formatNote(activeNote.content);
  }, [activeNote]);

  const handleGenerateImage = useCallback(async () => {
    if (!activeNote) return;
    return await geminiService.generateImageFromNote(activeNote.title, activeNote.content, imageStyle, imageAspectRatio);
  }, [activeNote, imageStyle, imageAspectRatio]);
  
  const handleApplyTags = useCallback(() => {
    if (activeNote && tags) {
        const newTags = [...new Set([...activeNote.tags, ...tags])];
        updateNote({ ...activeNote, tags: newTags });
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'tags' }});
        addToast(t('toast.tagsApplied'), 'success');
    }
  }, [activeNote, tags, updateNote, addToast, t]);

  const handlePrependSummary = useCallback(() => {
     if (activeNote && summary) {
        const newContent = `## ${t('aiPanel.analysis.summaryTitle')}\n\n${summary}\n\n---\n\n${activeNote.content}`;
        updateNote({ ...activeNote, content: newContent });
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'summary' }});
        addToast(t('toast.summaryPrepended'), 'success');
    }
  }, [activeNote, summary, updateNote, addToast, t]);

  const handleAppendChecklist = useCallback(() => {
    if (activeNote && plan) {
       const checklist = plan.map(task => `- [ ] ${task}`).join('\n');
       const newContent = `${activeNote.content}\n\n## ${t('aiPanel.plan.checklistTitle')}\n\n${checklist}\n`;
       updateNote({ ...activeNote, content: newContent });
       dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'plan' }});
       addToast(t('toast.checklistAppended'), 'success');
   }
 }, [activeNote, plan, updateNote, addToast, t]);

 const handleReplaceContent = useCallback((newContent: string) => {
    if (activeNote) {
        updateNote({ ...activeNote, content: newContent });
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'translation' }});
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'formatted' }});
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'recipeResult' }});
        addToast(t('toast.noteContentUpdated'), 'success');
    }
 }, [activeNote, updateNote, addToast, t]);

 const handleReplaceAll = useCallback((result: AiRecipeResult) => {
    if(activeNote) {
        updateNote({ ...activeNote, title: result.title, content: result.content, tags: result.tags || activeNote.tags });
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'recipeResult' }});
        addToast(t('toast.recipeResultApplied'), 'success');
    }
 }, [activeNote, updateNote, addToast, t]);

 const handleAppendImage = useCallback(() => {
    if (activeNote && image) {
        const markdownImage = `\n\n![${t('aiPanel.image.altText')}](data:image/png;base64,${image.imageBytes})\n`;
        updateNote({ ...activeNote, content: activeNote.content + markdownImage });
        addToast(t('toast.imageAppended'), 'success');
    }
 }, [activeNote, image, updateNote, addToast, t]);

  const handleCopyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    addToast(t('toast.copied', { type }), 'success');
  }, [addToast, t]);

  const handleRunRecipe = useCallback(async (recipeName: 'blog' | 'meeting' | 'social') => {
      if (!activeNote) return;
      if (recipeName === 'blog') {
          return await geminiService.runBlogPostRecipe(activeNote.title, activeNote.content, locale);
      } else if (recipeName === 'meeting') {
          return await geminiService.runMeetingAnalysisRecipe(activeNote.content, locale);
      } else {
          return await geminiService.runSocialPostRecipe(activeNote.content, locale);
      }
  }, [activeNote, locale]);

  if (!activeNote) {
    return <div className="p-4 text-center text-slate-500">{t('aiPanel.selectNote')}</div>;
  }
  
  const isRecipeLoading = loadingAgent && loadingAgent.startsWith('recipe-');
  const isStreaming = loadingAgent && streamingText;

  return (
    <div className="p-4 space-y-6">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <p className="font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5"/>{t('error')}</p>
          <p>{error}</p>
        </div>
      )}

      {!isApiKeySet && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 p-3 rounded-md text-sm">
            <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p><span className="font-bold">{t('warning')}:</span> {t('aiPanel.apiKeyMissing')}</p>
            </div>
        </div>
      )}

      {/* AI Recipes */}
      <AgentSection
        title={t('aiPanel.recipes.title')}
        icon={<Sparkles className="h-5 w-5 text-amber-500" />}
        hideRunButton={true}
        isCollapsed={!!collapsedSections['recipes']}
        onToggleCollapse={() => toggleSection('recipes')}
      >
        <div className="grid grid-cols-3 gap-2 mt-2">
            <RecipeButton icon={<BookCopy/>} text={t('aiPanel.recipes.blog.button')} onClick={() => runAgent('recipe-blog', () => handleRunRecipe('blog'))} isLoading={loadingAgent === 'recipe-blog'} disabled={!isApiKeySet} />
            <RecipeButton icon={<GanttChartSquare/>} text={t('aiPanel.recipes.meeting.button')} onClick={() => runAgent('recipe-meeting', () => handleRunRecipe('meeting'))} isLoading={loadingAgent === 'recipe-meeting'} disabled={!isApiKeySet}/>
            <RecipeButton icon={<Megaphone/>} text={t('aiPanel.recipes.social.button')} onClick={() => runAgent('recipe-social', () => handleRunRecipe('social'))} isLoading={loadingAgent === 'recipe-social'} disabled={!isApiKeySet}/>
        </div>
        <div role="status" aria-live="polite">
          {isRecipeLoading && <LoadingPlaceholder text={t('aiPanel.recipes.loading')} />}
          {recipeResult && !isRecipeLoading && (
            <div className="mt-2 space-y-2">
              <div className="group relative">
                <div className="text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md max-h-60 overflow-y-auto">
                    <h4 className="font-bold">{recipeResult.title}</h4>
                    <hr className="my-2 border-slate-200 dark:border-slate-700"/>
                    <pre className="whitespace-pre-wrap font-sans">{recipeResult.content}</pre>
                </div>
              </div>
              <button onClick={() => handleReplaceAll(recipeResult)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Replace className="h-3 w-3"/> {t('aiPanel.actions.replaceNote')}</button>
            </div>
          )}
        </div>
      </AgentSection>
      
      <Divider/>

      {/* Analysis Agent */}
      <AgentSection
        title={t('aiPanel.analysis.title')}
        icon={<BrainCircuit className="h-5 w-5" />}
        onRun={() => runAgent('analysis', handleAnalysis, true)}
        isLoading={loadingAgent === 'analysis'}
        buttonText={t('aiPanel.analysis.button')}
        isCollapsed={!!collapsedSections['analysis']}
        onToggleCollapse={() => toggleSection('analysis')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'analysis' || !isApiKeySet}>
                <div className="text-sm p-2">
                    <label className="font-semibold block mb-1">{t('aiPanel.analysis.settings.summaryLength')}</label>
                    <div className="flex gap-2">
                        <button onClick={() => setConfig('summaryLength', 'short')} className={`px-2 py-1 rounded ${summaryLength === 'short' ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{t('aiPanel.analysis.settings.short')}</button>
                        <button onClick={() => setConfig('summaryLength', 'detailed')} className={`px-2 py-1 rounded ${summaryLength === 'detailed' ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{t('aiPanel.analysis.settings.detailed')}</button>
                    </div>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
          {isStreaming && loadingAgent === 'analysis' && <StreamingResult text={streamingText} />}
          {summary && !isStreaming && (
            <div className="mt-2 space-y-2">
              <h4 className="font-semibold text-sm">{t('aiPanel.analysis.summary')}:</h4>
              <div className="group relative">
                <p className="text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md">{summary}</p>
                <button onClick={() => handleCopyToClipboard(summary, t('aiPanel.analysis.summary'))} className="absolute top-1 right-1 p-1 rounded bg-slate-200 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="h-3 w-3"/></button>
              </div>
              <button onClick={handlePrependSummary} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">{t('aiPanel.actions.prepend')}</button>
            </div>
          )}
           {tags && tags.length > 0 && !isStreaming && (
            <div className="mt-2 space-y-2">
              <h4 className="font-semibold text-sm">{t('aiPanel.analysis.tags')}:</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => <span key={tag} className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-primary-900 dark:text-primary-300">{tag}</span>)}
              </div>
               <button onClick={handleApplyTags} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> {t('aiPanel.actions.addTags')}</button>
            </div>
          )}
        </div>
      </AgentSection>

      <Divider/>

      {/* Creative Agent */}
      <AgentSection
        title={t('aiPanel.creative.title')}
        icon={<Lightbulb className="h-5 w-5" />}
        onRun={() => runAgent('brainstorm', handleBrainstorm, true)}
        isLoading={loadingAgent === 'brainstorm'}
        buttonText={t('aiPanel.creative.button')}
        isCollapsed={!!collapsedSections['creative']}
        onToggleCollapse={() => toggleSection('creative')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'brainstorm' || !isApiKeySet}>
                <div className="text-sm p-2">
                    <label className="font-semibold block mb-1">{t('aiPanel.creative.settings.ideaCount')}</label>
                     <div className="flex gap-2">
                        {IDEA_COUNTS.map(num => (
                            <button key={num} onClick={() => setConfig('ideaCount', num)} className={`px-2 py-1 rounded ${ideaCount === num ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{num}</button>
                        ))}
                    </div>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
          {isStreaming && loadingAgent === 'brainstorm' && <StreamingResult text={streamingText} />}
          {ideas && ideas.length > 0 && !isStreaming && (
            <div className="mt-2 space-y-2">
              {ideas.map((idea, i) => 
                <div key={i} className="group relative text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md flex items-start">
                  <span className="mr-2 text-primary-500">•</span>
                  <p className="flex-1">{idea}</p>
                  <button onClick={() => handleCopyToClipboard(idea, t('aiPanel.creative.idea'))} className="ml-2 p-1 rounded bg-slate-200 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="h-3 w-3"/></button>
                </div>
              )}
            </div>
          )}
        </div>
      </AgentSection>

      <Divider/>

        {/* Image Agent */}
      <AgentSection
        title={t('aiPanel.image.title')}
        icon={<Image className="h-5 w-5" />}
        onRun={() => runAgent('image', handleGenerateImage)}
        isLoading={loadingAgent === 'image'}
        buttonText={t('aiPanel.image.button')}
        isCollapsed={!!collapsedSections['image']}
        onToggleCollapse={() => toggleSection('image')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'image' || !isApiKeySet}>
                <div className="text-sm p-2 space-y-2">
                    <div>
                        <label className="font-semibold block mb-1">{t('aiPanel.image.settings.style')}</label>
                        <select value={imageStyle} onChange={e => setConfig('imageStyle', e.target.value as AiAgentSettings['imageStyle'])} className="w-full p-1 rounded bg-slate-200 dark:bg-slate-700 capitalize">
                            {IMAGE_STYLES.map(style => <option key={style.value} value={style.value}>{t(style.labelKey)}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="font-semibold block mb-1">{t('aiPanel.image.settings.aspectRatio')}</label>
                        <div className="grid grid-cols-3 gap-1">
                            {IMAGE_ASPECT_RATIOS.map(ratio => (
                                <button key={ratio} onClick={() => setConfig('imageAspectRatio', ratio)} className={`px-2 py-1 rounded text-xs ${imageAspectRatio === ratio ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{ratio}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
            {loadingAgent === 'image' && <ImagePlaceholder aspectRatio={imageAspectRatio} />}
            {image && (
                <div className="mt-2 space-y-2">
                <img src={`data:image/png;base64,${image.imageBytes}`} alt={t('aiPanel.image.altText')} className="rounded-lg border border-slate-200 dark:border-slate-800" />
                <button onClick={handleAppendImage} className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> {t('aiPanel.actions.append')}</button>
                </div>
            )}
        </div>
      </AgentSection>

      <Divider/>
      
      {/* Planner Agent */}
      <AgentSection
        title={t('aiPanel.plan.title')}
        icon={<CheckSquare className="h-5 w-5" />}
        onRun={() => runAgent('plan', handlePlan, true)}
        isLoading={loadingAgent === 'plan'}
        buttonText={t('aiPanel.plan.button')}
        isCollapsed={!!collapsedSections['plan']}
        onToggleCollapse={() => toggleSection('plan')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'plan' || !isApiKeySet}>
                <div className="text-sm p-2">
                    <label className="font-semibold block mb-1">{t('aiPanel.plan.settings.detail')}</label>
                    <div className="flex gap-2">
                        <button onClick={() => setConfig('planDetail', 'simple')} className={`px-2 py-1 rounded ${planDetail === 'simple' ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{t('aiPanel.plan.settings.simple')}</button>
                        <button onClick={() => setConfig('planDetail', 'detailed')} className={`px-2 py-1 rounded ${planDetail === 'detailed' ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{t('aiPanel.plan.settings.detailed')}</button>
                    </div>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
          {isStreaming && loadingAgent === 'plan' && <StreamingResult text={streamingText} />}
          {plan && plan.length > 0 && !isStreaming && (
            <div className="mt-2 space-y-2">
              {plan.map((task, i) => 
                <div key={i} className="group relative text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md flex items-start">
                  <span className="mr-2 text-primary-500">•</span>
                  <p className="flex-1">{task}</p>
                   <button onClick={() => handleCopyToClipboard(task, t('aiPanel.plan.task'))} className="ml-2 p-1 rounded bg-slate-200 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="h-3 w-3"/></button>
                </div>
              )}
               <button onClick={handleAppendChecklist} className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> {t('aiPanel.actions.appendChecklist')}</button>
            </div>
          )}
        </div>
      </AgentSection>

      <Divider/>

      {/* Translator Agent */}
      <AgentSection
        title={t('aiPanel.translate.title')}
        icon={<Languages className="h-5 w-5" />}
        onRun={() => runAgent('translate', handleTranslate)}
        isLoading={loadingAgent === 'translate'}
        buttonText={t('aiPanel.translate.button')}
        isCollapsed={!!collapsedSections['translate']}
        onToggleCollapse={() => toggleSection('translate')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'translate' || !isApiKeySet}>
                <div className="text-sm p-2">
                    <label className="font-semibold block mb-1">{t('aiPanel.translate.settings.targetLanguage')}</label>
                     <select value={targetLanguage} onChange={e => setConfig('targetLanguage', e.target.value as AiAgentSettings['targetLanguage'])} className="w-full p-1 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                        {AVAILABLE_LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{t(lang.labelKey)}</option>)}
                    </select>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
          {loadingAgent === 'translate' && <LoadingPlaceholder text={t('aiPanel.translate.loading')} />}
          {translation && (
            <div className="mt-2 space-y-2">
              <div className="group relative">
                <p className="text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md max-h-40 overflow-y-auto">{translation.translatedText}</p>
                <button onClick={() => handleCopyToClipboard(translation.translatedText, t('aiPanel.translate.translation'))} className="absolute top-1 right-1 p-1 rounded bg-slate-200 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="h-3 w-3"/></button>
              </div>
              <button onClick={() => handleReplaceContent(translation.translatedText)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Replace className="h-3 w-3"/> {t('aiPanel.actions.replace')}</button>
            </div>
          )}
        </div>
      </AgentSection>
      
      <Divider/>

       {/* Formatter Agent */}
      <AgentSection
        title={t('aiPanel.format.title')}
        icon={<Wand2 className="h-5 w-5" />}
        onRun={() => runAgent('format', handleFormat)}
        isLoading={loadingAgent === 'format'}
        buttonText={t('aiPanel.format.button')}
        isCollapsed={!!collapsedSections['format']}
        onToggleCollapse={() => toggleSection('format')}
        disabled={!isApiKeySet}
      >
        <div role="status" aria-live="polite">
          {loadingAgent === 'format' && <LoadingPlaceholder text={t('aiPanel.format.loading')} />}
          {formatted && (
            <div className="mt-2 space-y-2">
              <div className="group relative">
                <p className="text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">{formatted.formattedText}</p>
                 <button onClick={() => handleCopyToClipboard(formatted.formattedText, t('aiPanel.format.formattedText'))} className="absolute top-1 right-1 p-1 rounded bg-slate-200 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="h-3 w-3"/></button>
              </div>
               <button onClick={() => handleReplaceContent(formatted.formattedText)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Replace className="h-3 w-3"/> {t('aiPanel.actions.replace')}</button>
            </div>
          )}
        </div>
      </AgentSection>


      <Divider/>


      {/* Research Agent */}
      <AgentSection
        title={t('aiPanel.research.title')}
        icon={<Search className="h-5 w-5" />}
        onRun={() => runAgent('research', handleResearch)}
        isLoading={loadingAgent === 'research'}
        buttonText={t('aiPanel.research.button')}
        isCollapsed={!!collapsedSections['research']}
        onToggleCollapse={() => toggleSection('research')}
        disabled={!isApiKeySet}
      >
        {/* No settings for research agent currently */}
        <div role="status" aria-live="polite">
        {loadingAgent === 'research' && <LoadingPlaceholder text={t('aiPanel.research.loading')} />}
        {research && (
          <div className="mt-2 space-y-3">
             {research.answer && <p className="text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded-md">{research.answer}</p>}
             {research.sources.length > 0 && <h4 className="font-semibold text-sm pt-2">{t('aiPanel.research.sources')}:</h4>}
            {research.sources.map((item, i) => (
              <a href={item.uri} target="_blank" rel="noopener noreferrer" key={i} className="block p-2 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
                <p className="font-semibold text-sm text-primary-600 dark:text-primary-400 truncate">{item.title}</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.uri}</p>
              </a>
            ))}
          </div>
        )}
        </div>
      </AgentSection>
    </div>
  );
};

interface AgentSettingsPopoverProps {
    children: React.ReactNode;
    disabled?: boolean;
}

const AgentSettingsPopover: React.FC<AgentSettingsPopoverProps> = ({ children, disabled = false }) => {
    const { t } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
    
    return (
        <div className="relative inline-block" ref={popoverRef}>
            <button
                onClick={(e) => { e.stopPropagation(); if(!disabled) setIsOpen(!isOpen); }}
                disabled={disabled}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('aiPanel.settings')}
            >
                <Settings className="h-4 w-4" />
            </button>
            {isOpen && (
                <div className="absolute z-10 -top-2 left-8 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700">
                    {children}
                </div>
            )}
        </div>
    );
};

const RecipeButton: React.FC<{icon: React.ReactNode, text: string, onClick: () => void, isLoading: boolean, disabled?: boolean}> = ({icon, text, onClick, isLoading, disabled}) => (
    <button
        onClick={onClick}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        className="flex flex-col items-center justify-center gap-1 p-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="h-5 w-5">{icon}</div>}
        <span>{text}</span>
    </button>
);


interface AgentSectionProps {
  title: string;
  icon: React.ReactNode;
  onRun?: () => void;
  isLoading?: boolean;
  buttonText?: string;
  children: React.ReactNode;
  hideRunButton?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  disabled?: boolean;
  settingsPopover?: React.ReactNode;
}

const AgentSection: React.FC<AgentSectionProps> = ({ title, icon, onRun, isLoading, buttonText, children, hideRunButton=false, isCollapsed, onToggleCollapse, disabled, settingsPopover }) => {
  const { t } = useLocale();
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg">
        <button onClick={onToggleCollapse} className="w-full flex justify-between items-center p-3 text-left cursor-pointer" aria-expanded={!isCollapsed}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
                {icon} {title}
            </h3>
            <div className="flex items-center gap-2">
                {settingsPopover}
                 {!hideRunButton && onRun && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRun(); }}
                        disabled={isLoading || disabled}
                        aria-busy={isLoading}
                        className="px-3 py-1 text-sm bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isLoading ? t('working') : buttonText}
                </button>
                )}
                <ChevronLeft className={`h-5 w-5 text-slate-400 transition-transform ${isCollapsed ? 'rotate-0' : '-rotate-90'}`} />
            </div>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
            <div className="overflow-hidden">
                <div className="p-3 pt-0">
                    {children}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AiAgentPanel;
```

---

### `components/KnowledgeGraph.tsx`

```tsx
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { select } from 'd3-selection';
import { forceSimulation, forceLink, forceManyBody, forceCenter, Simulation, ForceLink } from 'd3-force';
import { drag, D3DragEvent } from 'd3-drag';
import { zoom, D3ZoomEvent } from 'd3-zoom';
import { Note, GraphNode, GraphLink } from '../types';
import { Share2 } from './icons';
import { useLocale } from '../contexts/LocaleContext';
import { WIKI_LINK_REGEX, findNoteByTitle } from '../utils/noteUtils';

interface KnowledgeGraphProps {
  notes: Note[];
  onNodeClick: (id: string) => void;
  activeNodeId: string | null;
  colors: {
      link: string;
      node: string;
      activeNode: string;
      text: string;
      stroke: string;
  };
  charge: number;
  linkDistance: number;
}

const createDragHandler = (simulation: Simulation<GraphNode, GraphLink>) => {
  function dragstarted(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
    if (!event.active) simulation.alphaTarget(0).restart();
    d.fx = null;
    d.fy = null;
  }

  return drag<SVGGElement, GraphNode>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};


const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ notes, onNodeClick, activeNodeId, colors, charge, linkDistance }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const { t } = useLocale();

  // Memoize graph data to prevent re-computation on every content change
  const { nodes, links, linkedByIndex } = useMemo(() => {
    const graphNodes: GraphNode[] = notes.map(note => ({
      id: note.id,
      title: note.title,
      radius: 8 + Math.min(Math.floor(note.content.length / 100), 12),
    }));

    const linkSet = new Set<string>();
    const finalLinks: GraphLink[] = [];

    // 1. Links from tags
    const tagMap: { [key:string]: string[] } = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        if (!tagMap[tag]) tagMap[tag] = [];
        tagMap[tag].push(note.id);
      });
    });

    Object.values(tagMap).forEach(noteIds => {
      if (noteIds.length > 1) {
        for (let i = 0; i < noteIds.length; i++) {
          for (let j = i + 1; j < noteIds.length; j++) {
            const source = noteIds[i];
            const target = noteIds[j];
            const key = [source, target].sort().join('-');
            if (!linkSet.has(key)) {
                linkSet.add(key);
                finalLinks.push({ source, target, type: 'tag' });
            }
          }
        }
      }
    });
    
    // 2. Links from [[Wiki-Links]]
    notes.forEach(note => {
        const matches = note.content.matchAll(WIKI_LINK_REGEX);
        for (const match of matches) {
            const targetTitle = match[1];
            const targetNote = findNoteByTitle(notes, targetTitle);
            if (targetNote && targetNote.id !== note.id) {
                const source = note.id;
                const target = targetNote.id;
                const key = [source, target].sort().join('-');
                // We allow directed links for wiki-links, so key is not sorted
                const directedKey = `${source}->${target}`;
                 if (!linkSet.has(directedKey)) {
                    linkSet.add(directedKey);
                    finalLinks.push({ source, target, type: 'explicit' });
                }
            }
        }
    });
    
    const linkedByIndex: {[key: string]: boolean} = {};
    finalLinks.forEach(d => {
        const sourceId = (d.source as GraphNode).id || (d.source as string);
        const targetId = (d.target as GraphNode).id || (d.target as string);
        linkedByIndex[`${sourceId},${targetId}`] = true;
    });

    return { nodes: graphNodes, links: finalLinks, linkedByIndex };
  }, [notes]);
  
  const isConnected = useCallback((aId: string, bId: string) => {
    return linkedByIndex[`${aId},${bId}`] || linkedByIndex[`${bId},${aId}`] || aId === bId;
  }, [linkedByIndex]);

  const updateNodeAndLinkAppearance = useCallback(() => {
    if (!gRef.current) return;
    const g = select(gRef.current);
    const node = g.selectAll<SVGGElement, GraphNode>('.node');
    const link = g.selectAll<SVGLineElement, GraphLink>('.link');
    const text = g.selectAll<SVGTextElement, GraphNode>('.node-text');

    if (!activeNodeId) {
        node.style('opacity', 1);
        link.style('opacity', l => l.type === 'explicit' ? 0.9 : 0.6);
        text.style('opacity', 1);
        return;
    }
    
    node.style('opacity', d => isConnected(activeNodeId, d.id) ? 1.0 : 0.2);
    link.style('opacity', d => {
        const sourceId = (d.source as GraphNode).id || (d.source as string);
        const targetId = (d.target as GraphNode).id || (d.target as string);
        return sourceId === activeNodeId || targetId === activeNodeId ? 1.0 : 0.1;
    });
    text.style('opacity', d => isConnected(activeNodeId, d.id) ? 1.0 : 0.2);

  }, [activeNodeId, isConnected]);


  // One-time setup effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height]);
    
    svg.append("g").each(function() { gRef.current = this as SVGGElement; });
    const g = select(gRef.current);

    simulationRef.current = forceSimulation<GraphNode, GraphLink>([])
      .force('link', forceLink<GraphNode, GraphLink>().id(d => d.id))
      .force('charge', forceManyBody())
      .force('center', forceCenter(0, 0))
      .alphaMin(0.01) // Keep the graph alive with subtle motion
      .on('tick', () => {
        g.selectAll('.node').attr('transform', d => `translate(${(d as GraphNode).x},${(d as GraphNode).y})`);
        g.selectAll('.link')
          .attr('x1', d => ((d as GraphLink).source as GraphNode).x!)
          .attr('y1', d => ((d as GraphLink).source as GraphNode).y!)
          .attr('x2', d => ((d as GraphLink).target as GraphNode).x!)
          .attr('y2', d => ((d as GraphLink).target as GraphNode).y!);
      });

    const zoomBehavior = zoom<SVGSVGElement, unknown>().on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr('transform', event.transform.toString());
    });
    svg.call(zoomBehavior);

    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) {
          return;
        }
        if (!svgRef.current) return;
        const { width, height } = entries[0].contentRect;
        select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height]);
        simulationRef.current?.force('center', forceCenter(0, 0));
      });
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    return () => {
        resizeObserver.disconnect();
        simulationRef.current?.stop();
    };
  }, []);

  // Effect to update simulation forces when props change
  useEffect(() => {
    if (!simulationRef.current) return;
    simulationRef.current.force('charge', forceManyBody().strength(charge));
    (simulationRef.current.force('link') as ForceLink<GraphNode, GraphLink>)?.links(links).distance(linkDistance);
    simulationRef.current.alpha(0.3).restart();
  }, [charge, linkDistance, links]);

  const nodeMouseOver = useCallback((_event: MouseEvent, d: GraphNode) => {
    if (!gRef.current) return;
    const g = select(gRef.current);
    g.selectAll<SVGGElement, GraphNode>('.node').style('opacity', o => isConnected(d.id, o.id) ? 1.0 : 0.2);
    g.selectAll<SVGLineElement, GraphLink>('.link').style('opacity', o => {
        const sourceId = (o.source as GraphNode).id || o.source as string;
        const targetId = (o.target as GraphNode).id || o.target as string;
        return sourceId === d.id || targetId === d.id ? 1.0 : 0.1
    });
    g.selectAll<SVGTextElement, GraphNode>('.node-text').style('opacity', o => isConnected(d.id, o.id) ? 1.0 : 0.2);
  }, [isConnected]);

  const nodeMouseOut = useCallback(() => {
    updateNodeAndLinkAppearance();
  }, [updateNodeAndLinkAppearance]);


  // Effect to update data and DOM elements
  useEffect(() => {
    if (!simulationRef.current || !gRef.current) return;

    simulationRef.current.nodes(nodes);

    const g = select(gRef.current);
    const simulation = simulationRef.current;
    
    const linkData = g.selectAll<SVGLineElement, GraphLink>('.link')
      .data(links, d => `${(d.source as any).id || d.source}_${(d.target as any).id || d.target}`);
    
    linkData.exit().remove();
    linkData.enter().append('line')
      .attr('class', 'link')
      .style('transition', 'opacity 300ms ease');


    const nodeData = g.selectAll<SVGGElement, GraphNode>('.node')
      .data(nodes, d => d.id);
    
    nodeData.exit().remove();
    const nodeEnter = nodeData.enter().append('g')
      .attr('class', 'node cursor-pointer')
      .call(createDragHandler(simulation))
      .on('click', (event, d) => onNodeClick(d.id))
      .on('mouseover', nodeMouseOver)
      .on('mouseout', nodeMouseOut);
    
    nodeEnter.append('circle').attr('stroke-width', 2).style('transition', 'r 300ms ease, fill 300ms ease, opacity 300ms ease');
    
    const node = nodeData.merge(nodeEnter);

    nodeEnter.append('text')
      .attr('class', 'node-text')
      .attr('x', d => d.radius + 5)
      .attr('y', 5)
      .attr('font-size', '12px')
      .attr('paint-order', 'stroke')
      .attr('stroke-width', 3)
      .style('transition', 'opacity 300ms ease');

    g.selectAll<SVGTextElement, GraphNode>('.node-text').text(d => d.title);

    simulation.alpha(0.3).restart();

  }, [nodes, links, onNodeClick, nodeMouseOver, nodeMouseOut]);

  // Effect for visual updates (colors, active state, neighborhood)
  useEffect(() => {
    if (!gRef.current) return;
    const g = select(gRef.current);

    g.selectAll<SVGLineElement, GraphLink>('.link')
        .attr('stroke', colors.link)
        .attr('stroke-width', d => d.type === 'explicit' ? 2.5 : 1.5)
        .attr('stroke-dasharray', d => d.type === 'explicit' ? '4 2' : 'none');
    
    const allNodes = g.selectAll<SVGGElement, GraphNode>('.node');
    
    allNodes.select('circle')
        .attr('stroke', colors.stroke)
        .attr('fill', d => d.id === activeNodeId ? colors.activeNode : colors.node)
        .attr('r', d => d.id === activeNodeId ? d.radius * 1.2 : d.radius);

    allNodes.select('text')
        .attr('stroke', colors.stroke)
        .attr('fill', colors.text);
    
    updateNodeAndLinkAppearance();

  }, [colors, activeNodeId, nodes, links, updateNodeAndLinkAppearance]);

  return (
    <div ref={containerRef} className="w-full h-full cursor-grab">
       {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
            <Share2 className="mx-auto h-16 w-16 text-slate-400" />
            <h3 className="mt-4 text-xl font-semibold">{t('graph.empty.title')}</h3>
            <p className="mt-1 text-slate-400">{t('graph.empty.description')}</p>
        </div>
      ) : (
        <svg ref={svgRef}></svg>
      )}
    </div>
  );
};

export default KnowledgeGraph;
```

---

### `components/VersionHistory.tsx`

```tsx
import React, { useCallback, useMemo } from 'react';
import { Note, NoteHistory } from '../types';
import { History } from './icons';
import { useToast } from '../contexts/ToastContext';
import { useLocale } from '../contexts/LocaleContext';

interface VersionHistoryProps {
  activeNote: Note | null;
  onRestore: (content: string) => void;
}

interface VersionItemProps {
    version: NoteHistory;
    onRestore: (content: string) => void;
}

const VersionItem: React.FC<VersionItemProps> = React.memo(({ version, onRestore }) => {
    const { t, locale } = useLocale();

    const formattedDate = useMemo(() => {
        try {
            return new Date(version.updatedAt).toLocaleString(locale);
        } catch (e) {
            return 'Invalid Date';
        }
    }, [version.updatedAt, locale]);

    return (
        <li className="group p-3 rounded-md bg-slate-100 dark:bg-slate-900 border border-transparent hover:border-primary-500/30 transition-colors">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {t('history.versionFrom', { date: formattedDate })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {version.content.substring(0, 50).replace(/\s+/g, ' ')}...
                    </p>
                </div>
                <button
                    onClick={() => onRestore(version.content)}
                    className="px-3 py-1 text-sm bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {t('history.restore')}
                </button>
            </div>
        </li>
    )
});

const VersionHistory: React.FC<VersionHistoryProps> = ({ activeNote, onRestore }) => {
    const { addToast } = useToast();
    const { t } = useLocale();

    if (!activeNote) {
        return <div className="p-4 text-center text-slate-500">{t('history.selectNote')}</div>;
    }

    const handleRestore = useCallback((content: string) => {
        onRestore(content);
        addToast(t('toast.noteRestored'), 'success');
    }, [onRestore, addToast, t]);

    const history = activeNote.history || [];

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5" /> {t('history.title')}
            </h3>

            {history.length > 0 ? (
                <ul className="space-y-2">
                    {history.map((version, index) => (
                        <VersionItem 
                            key={version.updatedAt + index} 
                            version={version}
                            onRestore={handleRestore}
                        />
                    ))}
                </ul>
            ) : (
                <div className="text-center p-8 text-slate-500">
                    <History className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-semibold">{t('history.empty.title')}</h3>
                    <p className="mt-1 text-sm">{t('history.empty.description')}</p>
                </div>
            )}
        </div>
    );
};

export default VersionHistory;
```

---

### `components/icons.tsx`

```tsx
import React from 'react';

import {
  BrainCircuit,
  Plus,
  Trash2,
  Share2,
  Sparkles,
  Lightbulb,
  Search,
  Loader2,
  AlertTriangle,
  Pencil,
  Eye,
  ChevronLeft,
  X,
  Notebook,
  Bold,
  Italic,
  Link as LinkIcon, // Alias to avoid name collision
  List,
  Quote,
  Copy,
  NotebookPen,
  BookOpenCheck,
  History,
  Settings,
  CheckSquare,
  FileUp,
  FileDown,
  Sun,
  Moon,
  CheckCircle2,
  Pin,
  PinOff,
  Languages,
  Wand2,
  Image,
  Replace,
  LayoutTemplate,
  Save,
  SmilePlus,
  GanttChartSquare,
  BookCopy,
  Megaphone,
  HelpCircle,
  BookText,
  CircleHelp,
  Rocket,
  Target,
  Goal,
  Flag,
  Award,
  Trophy,
  Medal,
  Gift,
  Heart,
  Star,
  Home,
  Users,
  User,
  Briefcase,
  Folder,
  FileText,
  Calendar,
  Clock,
  Code,
  TerminalSquare,
  Database,
  Server,
  Cloud,
  Globe,
  MapPin,
  Compass,
  Coffee,
  Pizza,
  CookingPot,
  BookHeart,
  Music,
  Film,
  Camera,
  Palette,
  GraduationCap,
  FlaskConical,
  Atom,
  Bug,
  Construction,
  Plane,
  Ship,
  Car,
  Bike,
  Shield,
  Key,
  Lock,
  MessageSquare,
  Mail,
  Table2,
  Square,
  Tag,
  ChevronDown,
  Check,
  Command,
} from 'lucide-react';

type IconProps = React.HTMLAttributes<SVGElement>;

// Re-exporting with original names for a seamless, app-wide refactor.
// This allows all components to import icons from this central file.
export {
  BrainCircuit,
  Plus,
  Trash2,
  Share2,
  Sparkles,
  Lightbulb,
  Search,
  Loader2,
  AlertTriangle,
  Pencil,
  Eye,
  ChevronLeft,
  X,
  Notebook,
  Bold,
  Italic,
  List,
  Quote,
  Copy,
  NotebookPen,
  BookOpenCheck,
  History,
  Settings,
  CheckSquare,
  FileUp,
  FileDown,
  Sun,
  Moon,
  CheckCircle2,
  Pin,
  PinOff,
  Languages,
  Wand2,
  Image,
  Replace,
  LayoutTemplate,
  Save,
  SmilePlus,
  GanttChartSquare,
  BookCopy,
  Megaphone,
  HelpCircle,
  BookText,
  CircleHelp,
  Rocket,
  Target,
  Goal,
  Flag,
  Award,
  Trophy,
  Medal,
  Gift,
  Heart,
  Star,
  Home,
  Users,
  User,
  Briefcase,
  Folder,
  FileText,
  Calendar,
  Clock,
  Code,
  TerminalSquare,
  Database,
  Server,
  Cloud,
  Globe,
  MapPin,
  Compass,
  Coffee,
  Pizza,
  CookingPot,
  BookHeart,
  Music,
  Film,
  Camera,
  Palette,
  GraduationCap,
  FlaskConical,
  Atom,
  Bug,
  Construction,
  Plane,
  Ship,
  Car,
  Bike,
  Shield,
  Key,
  Lock,
  MessageSquare,
  Mail,
  Square,
  Tag,
  ChevronDown,
  Check,
  Command,
};

// Handle the alias for 'Link' to avoid conflicts
export const Link: React.FC<IconProps> = (props) => <LinkIcon {...props} />;
export const Table: React.FC<IconProps> = (props) => <Table2 {...props} />;
```

---

### `services/geminiService.ts`

```ts
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BrainstormSuggestion, PlannerSuggestion, ResearchSuggestion, TranslateSuggestion, FormatSuggestion, ImageSuggestion, AiRecipeResult } from "../types";

const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("Google AI API Key is not configured. AI features are disabled.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
}

const getLanguageInstruction = (locale: 'en' | 'de') => {
  if (locale === 'de') {
    return 'The response must be in German.';
  }
  return '';
};


// --- Type Guards for API Responses ---

function isAnalysisResult(obj: any): obj is { summary: string; tags: string[] } {
    return (
        obj &&
        typeof obj.summary === 'string' &&
        Array.isArray(obj.tags) &&
        obj.tags.every((t: any) => typeof t === 'string')
    );
}

function isBrainstormSuggestion(obj: any): obj is BrainstormSuggestion {
    return obj && Array.isArray(obj.ideas) && obj.ideas.every((i: any) => typeof i === 'string');
}

function isPlannerSuggestion(obj: any): obj is PlannerSuggestion {
    return obj && Array.isArray(obj.tasks) && obj.tasks.every((t: any) => typeof t === 'string');
}

function isTranslateSuggestion(obj: any): obj is TranslateSuggestion {
    return obj && typeof obj.translatedText === 'string';
}

function isFormatSuggestion(obj: any): obj is FormatSuggestion {
    return obj && typeof obj.formattedText === 'string';
}

function isTitledContentWithTagsResult(obj: any): obj is AiRecipeResult {
    return (
        obj &&
        typeof obj.title === 'string' &&
        typeof obj.content === 'string' &&
        Array.isArray(obj.tags) &&
        obj.tags.every((t: any) => typeof t === 'string')
    );
}

function isMeetingAnalysisResult(obj: any): obj is AiRecipeResult {
    return obj && typeof obj.title === 'string' && typeof obj.content === 'string';
}

// --- Generic Helpers for API Calls ---

async function generateAndParseJSON<T>(
  prompt: string,
  config: any, // The config object for generateContent, excluding model and contents
  typeGuard: (obj: any) => obj is T
): Promise<T> {
  const ai = getAiClient();
  const result: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: config,
  });

  try {
    const textResponse = result.text?.trim();
    if (!textResponse) {
        throw new Error("Received an empty response from the AI.");
    }
    const parsed = JSON.parse(textResponse);
    if (typeGuard(parsed)) {
      return parsed;
    }
    throw new Error("Parsed JSON does not match the expected format.");
  } catch (e: any) {
    console.error("Failed to parse JSON from Gemini:", result.text, e);
    const errorMessage = e.message.includes("format") 
        ? "Received invalid data structure from AI." 
        : "Received invalid JSON from AI.";
    throw new Error(errorMessage);
  }
}

async function generateStream(prompt: string, onChunk: (chunk: string) => void) {
    const ai = getAiClient();
    const result = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    for await (const chunk of result) {
        onChunk(chunk.text);
    }
}


// --- API Service Functions ---

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A summary of the note's content.",
    },
    tags: {
      type: Type.ARRAY,
      description: "A list of 3-5 relevant lowercase keyword tags.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["summary", "tags"],
};

export const getSummaryAndTags = async (content: string, options: { length: 'short' | 'detailed' }, locale: 'en' | 'de'): Promise<{ summary: string; tags: string[] }> => {
  const langInstruction = getLanguageInstruction(locale);
  const summaryInstruction = options.length === 'detailed' 
    ? "The summary should be a detailed paragraph."
    : "The summary should be a concise 1-2 sentences.";
  
  return generateAndParseJSON(
    `Analyze the following note content and provide a summary and relevant tags. ${summaryInstruction} ${langInstruction} Note content: "${content}"`,
    { responseMimeType: "application/json", responseSchema: analysisSchema },
    isAnalysisResult
  );
};

export const getSummaryStream = async (content: string, options: { length: 'short' | 'detailed' }, locale: 'en' | 'de', onChunk: (chunk: string) => void) => {
    const langInstruction = getLanguageInstruction(locale);
    const summaryInstruction = options.length === 'detailed' 
    ? "The summary should be a detailed paragraph."
    : "The summary should be a concise 1-2 sentences.";
    const prompt = `Summarize the following note. ${summaryInstruction} ${langInstruction} Note content: "${content}"`;
    await generateStream(prompt, onChunk);
}

const brainstormSchema = {
  type: Type.OBJECT,
  properties: {
    ideas: {
      type: Type.ARRAY,
      description: "A list of creative ideas, next steps, or related concepts.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["ideas"],
};

export const getBrainstormingIdeas = async (content: string, options: { count: 3 | 5 | 7 }, locale: 'en' | 'de'): Promise<BrainstormSuggestion> => {
    const langInstruction = getLanguageInstruction(locale);
    return generateAndParseJSON(
        `Based on the following note, brainstorm exactly ${options.count} creative ideas or next steps. Keep each idea concise. ${langInstruction} Note content: "${content}"`,
        {
          responseMimeType: "application/json",
          responseSchema: brainstormSchema,
        },
        isBrainstormSuggestion
    );
};

export const getBrainstormingIdeasStream = async (content: string, options: { count: 3 | 5 | 7 }, locale: 'en' | 'de', onChunk: (chunk: string) => void) => {
    const langInstruction = getLanguageInstruction(locale);
    const prompt = `Based on the following note, brainstorm exactly ${options.count} creative ideas or next steps. Format each idea on a new line, starting with '- '. ${langInstruction} Note content: "${content}"`;
    await generateStream(prompt, onChunk);
}

const plannerSchema = {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        description: "A list of actionable tasks or steps to achieve the goal described in the note.",
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ["tasks"],
  };
  
export const getTaskPlan = async (content: string, options: { detail: 'simple' | 'detailed' }, locale: 'en' | 'de'): Promise<PlannerSuggestion> => {
      const langInstruction = getLanguageInstruction(locale);
      const promptDetail = options.detail === 'detailed' 
        ? "create a detailed, granular plan of actionable steps. Include sub-tasks if necessary."
        : "create a simple plan of 3-5 high-level actionable steps.";

      return generateAndParseJSON(
        `Based on the following note, ${promptDetail}. ${langInstruction} Note content: "${content}"`,
        { responseMimeType: "application/json", responseSchema: plannerSchema },
        isPlannerSuggestion
      );
};

export const getTaskPlanStream = async (content: string, options: { detail: 'simple' | 'detailed' }, locale: 'en' | 'de', onChunk: (chunk: string) => void) => {
      const langInstruction = getLanguageInstruction(locale);
      const promptDetail = options.detail === 'detailed' 
        ? "create a detailed, granular plan of actionable steps. Include sub-tasks if necessary."
        : "create a simple plan of 3-5 high-level actionable steps.";
      const prompt = `Based on the following note, ${promptDetail}. Format each task on a new line starting with '- '. ${langInstruction} Note content: "${content}"`;
      await generateStream(prompt, onChunk);
}

export const getResearchLinks = async (content: string, locale: 'en' | 'de'): Promise<ResearchSuggestion> => {
  const ai = getAiClient();
  const langInstruction = getLanguageInstruction(locale);
  const result: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Based on the following note, provide a concise answer and list relevant online resources. ${langInstruction} Note: "${content.substring(0, 500)}"`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const answer = result.text;
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  const sources = groundingChunks.map((chunk) => {
      return {
          title: chunk.web?.title || 'Untitled Source',
          uri: chunk.web?.uri || '#',
      };
  }).filter(item => item.uri !== '#');

  if (!answer && sources.length === 0) {
      const message = locale === 'de'
        ? "Keine Online-Ergebnisse zu diesem Thema gefunden. Versuchen Sie, Ihren Notizinhalt zu verfeinern, um bessere Rechercheergebnisse zu erzielen."
        : "No online results found for this topic. Try refining your note content for better research results.";

      return {
          answer: message,
          sources: []
      }
  }

  return { answer, sources: sources.slice(0, 3) };
};

const translationSchema = {
    type: Type.OBJECT,
    properties: {
        translatedText: { type: Type.STRING }
    },
    required: ["translatedText"],
};

export const translateNote = async (content: string, language: string): Promise<TranslateSuggestion> => {
    return generateAndParseJSON(
        `Translate the following text to ${language}. Preserve the original markdown formatting. Text: "${content}"`,
        { responseMimeType: "application/json", responseSchema: translationSchema },
        isTranslateSuggestion
    );
};

const formatSchema = {
    type: Type.OBJECT,
    properties: {
        formattedText: { type: Type.STRING }
    },
    required: ["formattedText"],
};

export const formatNote = async (content: string): Promise<FormatSuggestion> => {
    return generateAndParseJSON(
        `Format the following text into clean and well-structured Markdown. Add headings, lists, and other elements where appropriate to improve readability. Text: "${content}"`,
        { responseMimeType: "application/json", responseSchema: formatSchema },
        isFormatSuggestion
    );
};

export const generateImageFromNote = async (
    noteTitle: string, 
    noteContent: string, 
    style: string,
    aspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16'
): Promise<ImageSuggestion> => {
    const ai = getAiClient();
    const stylePrompt = style === 'default' ? '' : `, in the style of ${style}`;
    const prompt = `Generate an image based on the following note${stylePrompt}. Title: "${noteTitle}". Content: "${noteContent.substring(0, 250)}". Focus on creating a visually compelling representation of the key concepts.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });
    
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("Image generation failed to return an image.");
    }
    return { imageBytes: base64ImageBytes };
};


// AI Recipes
const blogPostSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A catchy, SEO-friendly title for the blog post." },
        content: { type: Type.STRING, description: "The full blog post content, formatted in Markdown, including an introduction, several sections with headings, and a conclusion." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 5 relevant tags for the blog post." }
    },
    required: ["title", "content", "tags"]
};

export const runBlogPostRecipe = async (originalTitle: string, noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
    const langInstruction = getLanguageInstruction(locale);
    return generateAndParseJSON(
        `Take the following note content and expand it into a well-structured blog post. The original title was "${originalTitle}". Create a new catchy title, write the full content in Markdown, and suggest 5 tags. ${langInstruction} Note: "${noteContent}"`,
        { responseMimeType: "application/json", responseSchema: blogPostSchema },
        isTitledContentWithTagsResult
    );
};


const meetingAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A new title for the note in the format 'Meeting Summary: [Original Topic] - [Date]'." },
        content: { type: Type.STRING, description: "A summary of the meeting formatted in Markdown. It must include three sections: 'Key Decisions', 'Action Items' (as a Markdown checklist), and 'General Summary'." }
    },
    required: ["title", "content"]
}

export const runMeetingAnalysisRecipe = async (noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
     const langInstruction = getLanguageInstruction(locale);
     const titleFormat = locale === 'de' ? "'Meeting-Zusammenfassung: [Originalthema] - [Datum]'" : "'Meeting Summary: [Original Topic] - [Date]'";
     const sections = locale === 'de'
        ? "'Wichtige Entscheidungen', 'Aktionspunkte' (als Markdown-Checkliste) und 'Allgemeine Zusammenfassung'"
        : "'Key Decisions', 'Action Items' (as a Markdown checklist), and 'General Summary'";

     return generateAndParseJSON(
        `Analyze the following meeting notes. Create a new title for the summary including today's date (${new Date().toLocaleDateString()}) in the format ${titleFormat}. Then, write a new note content that extracts and summarizes the key decisions, lists all action items as a markdown checklist, and provides a general summary. The response must include three sections: ${sections}. ${langInstruction} Notes: "${noteContent}"`,
        { responseMimeType: "application/json", responseSchema: meetingAnalysisSchema },
        isMeetingAnalysisResult
    );
}

const socialPostSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A short, descriptive title for the note, summarizing the social post's topic." },
        content: { type: Type.STRING, description: "The content for a social media post (e.g., for LinkedIn or X), formatted in Markdown, including 3-5 relevant hashtags at the end." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 3-5 relevant keyword tags for the note itself." }
    },
    required: ["title", "content", "tags"]
};

export const runSocialPostRecipe = async (noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
    const langInstruction = getLanguageInstruction(locale);
    return generateAndParseJSON(
        `From the following note, draft a concise and engaging social media post. Create a new, short title for the note. Write the post content in Markdown, ending with 3-5 relevant hashtags. Suggest 3-5 keyword tags for the note. ${langInstruction} Note: "${noteContent}"`,
        { responseMimeType: "application/json", responseSchema: socialPostSchema },
        isTitledContentWithTagsResult
    );
};
```

---

### `components/ThemeProvider.tsx`

```tsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { Sun, Moon } from './icons';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('theme') as Theme;
      if (storedTheme) {
        return storedTheme;
      }
      return 'dark'; // Default to dark mode
    } catch (e) {
      // localStorage is not available
      return 'dark'; // Default to dark mode
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error("Failed to save theme preference.");
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
};
```

---

### `components/BottomNavbar.tsx`

```tsx
import React from 'react';
import { Notebook, Plus, BrainCircuit } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface BottomNavbarProps {
  onNavigate: (view: 'list' | 'sidebar') => void;
  onAddNote: () => void;
  activeView: 'list' | 'editor' | 'sidebar';
}

interface NavButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400 hover:text-primary-500'}`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
);

const AddNoteButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { t } = useLocale();
    return (
        <button 
            onClick={onClick} 
            className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg -mt-6 hover:bg-primary-700 transition-transform transform hover:scale-105"
            aria-label={t('noteList.newNote')}
        >
            <Plus className="h-7 w-7" />
        </button>
    );
};


const BottomNavbar: React.FC<BottomNavbarProps> = ({ onNavigate, onAddNote, activeView }) => {
  const { t } = useLocale();
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex md:hidden items-center justify-around z-40">
      <NavButton
        label={t('sidebar.notes')}
        icon={<Notebook className="h-6 w-6" />}
        isActive={activeView === 'list' || activeView === 'editor'}
        onClick={() => onNavigate('list')}
      />
      <AddNoteButton onClick={onAddNote} />
      <NavButton
        label={t('rightSidebar.tabs.ai')}
        icon={<BrainCircuit className="h-6 w-6" />}
        isActive={activeView === 'sidebar'}
        onClick={() => onNavigate('sidebar')}
      />
    </nav>
  );
};

export default BottomNavbar;
```

---

### `contexts/NoteContext.tsx`

```tsx
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
```

---

### `contexts/ToastContext.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ToastMessage, ToastType } from '../types';
import Toast from '../components/Toast';

interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastMessage & { duration?: number })[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {ReactDOM.createPortal(
        <div 
            className="fixed top-4 right-4 z-50 space-y-2"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
        >
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} duration={toast.duration} />
          ))}
        </div>,
        document.getElementById('toast-container')!
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
```

---

### `contexts/SettingsContext.tsx`

```tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { AppSettings, AiAgentSettings } from '../types';

const defaultSettings: AppSettings = {
    density: 'default',
    font: 'system-ui',
    reduceMotion: false,
    editorFontSize: 'medium',
    focusMode: false,
    autoSaveDelay: 1500,
    showWordCount: true,
    defaultEditorView: 'edit',
    aiAgentDefaults: {
        summaryLength: 'short',
        ideaCount: 3,
        planDetail: 'simple',
        targetLanguage: 'English',
        imageStyle: 'default',
        imageAspectRatio: '1:1',
    }
};

interface SettingsContextType {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setAiSetting: <K extends keyof AiAgentSettings>(key: K, value: AiAgentSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const storedSettings = localStorage.getItem('omninote_settings');
      if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          // Deep merge to ensure new default settings are applied if not present in storage
          return {
              ...defaultSettings,
              ...parsed,
              aiAgentDefaults: {
                  ...defaultSettings.aiAgentDefaults,
                  ...(parsed.aiAgentDefaults || {})
              }
          };
      }
      return defaultSettings;
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('omninote_settings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  const setSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const setAiSetting = useCallback(<K extends keyof AiAgentSettings>(key: K, value: AiAgentSettings[K]) => {
    setSettings(prev => ({
        ...prev,
        aiAgentDefaults: {
            ...prev.aiAgentDefaults,
            [key]: value
        }
    }))
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem('omninote_settings');
  }, []);

  const value = useMemo(() => ({ settings, setSetting, setAiSetting, resetSettings }), [settings, setSetting, setAiSetting, resetSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
```

---

### `components/NoteListItem.tsx`

```tsx
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
```

---

### `components/SearchNotes.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { Search } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface SearchNotesProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const SearchNotes: React.FC<SearchNotesProps> = ({ query, onQueryChange }) => {
  const { t } = useLocale();
  // We use a local state for the input value to provide immediate feedback to the user.
  const [inputValue, setInputValue] = useState(query);

  // When the external query changes (e.g., cleared programmatically), update the local state.
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Debounce the call to the parent's onQueryChange function.
  useEffect(() => {
    const identifier = setTimeout(() => {
      if (query !== inputValue) {
        onQueryChange(inputValue);
      }
    }, 300); // 300ms delay
    return () => clearTimeout(identifier);
  }, [inputValue, onQueryChange, query]);


  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );
};

export default SearchNotes;
```

---

### `components/NoteEditorToolbar.tsx`

```tsx
import React from 'react';
import { Bold, Italic, Link, List, Quote, Table } from './icons';

interface NoteEditorToolbarProps {
  onApplyMarkdown: (syntax: { prefix: string; suffix?: string; placeholder?: string }) => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; label: string }> = ({ onClick, children, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
  >
    {children}
  </button>
);

const NoteEditorToolbar: React.FC<NoteEditorToolbarProps> = ({ onApplyMarkdown }) => {
    
  const handleBold = () => onApplyMarkdown({ prefix: '**', suffix: '**', placeholder: 'bold text' });
  const handleItalic = () => onApplyMarkdown({ prefix: '*', suffix: '*', placeholder: 'italic text' });
  const handleLink = () => onApplyMarkdown({ prefix: '[', suffix: '](url)', placeholder: 'link text' });
  const handleList = () => onApplyMarkdown({ prefix: '- ', placeholder: 'List item' });
  const handleQuote = () => onApplyMarkdown({ prefix: '> ', placeholder: 'Quote' });
  const handleTable = () => onApplyMarkdown({ 
      prefix: '\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n',
      placeholder: '' 
  });


  return (
    <div className="flex items-center gap-1 p-1 border-b border-slate-200 dark:border-slate-800">
      <ToolbarButton onClick={handleBold} label="Bold"><Bold className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton onClick={handleItalic} label="Italic"><Italic className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton onClick={handleLink} label="Insert Link"><Link className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton onClick={handleList} label="Bulleted List"><List className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton onClick={handleQuote} label="Blockquote"><Quote className="h-4 w-4" /></ToolbarButton>
      <ToolbarButton onClick={handleTable} label="Insert Table"><Table className="h-4 w-4" /></ToolbarButton>
    </div>
  );
};

export default NoteEditorToolbar;
```

---

### `components/Toast.tsx`

```tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ToastMessage } from '../types';
import { X, AlertTriangle, BrainCircuit, CheckCircle2 } from './icons';

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <AlertTriangle className="h-5 w-5 text-red-500" />,
  info: <BrainCircuit className="h-5 w-5 text-blue-500" />,
};

const bgColors = {
  success: 'bg-green-50 dark:bg-green-900/50 border-green-500/30',
  error: 'bg-red-50 dark:bg-red-900/50 border-red-500/30',
  info: 'bg-blue-50 dark:bg-blue-900/50 border-blue-500/30',
};

const Toast: React.FC<ToastProps> = ({ toast, onClose, duration = 4000 }) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  // Use a ref for onClose to avoid re-running useEffect when it changes
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onCloseRef.current(), 300);
  }, []);
  
  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(handleClose, duration);
  }, [handleClose, duration]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);
  

  return (
    <div
      className={`
        flex items-center p-3 rounded-lg shadow-lg border w-80
        transition-all duration-300 ease-in-out
        ${bgColors[toast.type]}
        ${exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="ml-3 mr-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        {toast.message}
      </div>
      <button 
        onClick={handleClose} 
        className="ml-auto p-1 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
```

---

### `components/SettingsModal.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Note, Template, AppSettings, AiAgentSettings, AVAILABLE_LANGUAGES } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import { X, FileDown, FileUp, AlertTriangle, Palette, Pencil, BrainCircuit, Database } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'all' | 'notes' | 'templates' | 'settings') => void;
  onImport: (data: { notes?: Note[], templates?: Template[], settings?: AppSettings }) => void;
}

type Tab = 'appearance' | 'editor' | 'ai' | 'data';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onExport, onImport }) => {
  const { addToast } = useToast();
  const { settings, setSetting, resetSettings, setAiSetting } = useSettings();
  const { locale, setLocale, t } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [exportType, setExportType] = useState<'all' | 'notes' | 'templates' | 'settings'>('all');
  const [activeTab, setActiveTab] = useState<Tab>('appearance');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsEntering(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImportClick = () => {
    if (!file) {
      addToast(t('toast.selectFile'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error(t('toast.fileReadError'));
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') throw new Error(t('toast.invalidFileFormat'));

        // Pass all data to parent handler
        onImport(data);

        // Apply settings directly
        if (data.settings && typeof data.settings === 'object') {
            Object.keys(data.settings).forEach(key => {
                if (key !== 'aiAgentDefaults') {
                     setSetting(key as keyof AppSettings, data.settings[key as keyof AppSettings]);
                }
            });
            if (data.settings.aiAgentDefaults) {
                Object.keys(data.settings.aiAgentDefaults).forEach(key => {
                    setAiSetting(key as keyof AiAgentSettings, data.settings.aiAgentDefaults[key as keyof AiAgentSettings]);
                });
            }
        }
        
      } catch (error: any) {
        addToast(t('toast.importFailedDetails', { message: error.message }), 'error');
        console.error('Import error:', error);
      }
    };
    reader.onerror = () => addToast(t('toast.fileReadError'), 'error');
    reader.readAsText(file);
  };
  
  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: <Palette className="h-4 w-4" /> },
    { id: 'editor', label: t('settings.tabs.editor'), icon: <Pencil className="h-4 w-4" /> },
    { id: 'ai', label: t('settings.tabs.ai'), icon: <BrainCircuit className="h-4 w-4" /> },
    { id: 'data', label: t('settings.tabs.data'), icon: <Database className="h-4 w-4" /> },
  ];

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" 
        aria-modal="true"
        role="dialog"
    >
      <div 
        ref={modalRef}
        className={`bg-slate-50 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col transition-all duration-200 ease-out ${isEntering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.title')}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800" aria-label={t('settings.close')}>
                <X className="h-5 w-5" />
            </button>
        </div>
        
        <div className="flex border-b border-slate-200 dark:border-slate-800">
             <div className="p-4 border-r border-slate-200 dark:border-slate-800 w-48 flex-shrink-0">
                <SettingsRow label={t('settings.general.language')} direction='col'>
                    <SegmentedControl options={[{label: 'EN', value: 'en'}, {label: 'DE', value: 'de'}]} value={locale} onChange={(value) => setLocale(value)} />
                </SettingsRow>
                 <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left flex items-center gap-2 p-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
             </div>
            <div className="p-6 overflow-y-auto flex-1">
                {activeTab === 'appearance' && (
                    <div className="space-y-6">
                         <SettingsRow label={t('settings.appearance.density.label')}>
                            <SegmentedControl options={[{label: t('settings.appearance.density.compact'), value: 'compact'}, {label: t('settings.appearance.density.default'), value: 'default'}, {label: t('settings.appearance.density.comfortable'), value: 'comfortable'}]} value={settings.density} onChange={(value) => setSetting('density', value)} />
                        </SettingsRow>
                        <SettingsRow label={t('settings.appearance.font.label')}>
                            <select value={settings.font} onChange={(e) => setSetting('font', e.target.value as AppSettings['font'])} className="w-40 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm">
                                <option value="system-ui">{t('settings.appearance.font.system')}</option>
                                <option value="serif">{t('settings.appearance.font.serif')}</option>
                                <option value="monospace">{t('settings.appearance.font.monospace')}</option>
                            </select>
                        </SettingsRow>
                         <SettingsRow label={t('settings.appearance.reduceMotion')}>
                           <ToggleSwitch checked={settings.reduceMotion} onChange={(checked) => setSetting('reduceMotion', checked)} />
                        </SettingsRow>
                    </div>
                )}
                 {activeTab === 'editor' && (
                     <div className="space-y-6">
                         <SettingsRow label={t('settings.editor.autoSaveDelay')}>
                            <SegmentedControl options={[{label: '1.5s', value: 1500}, {label: '3s', value: 3000}, {label: '5s', value: 5000}]} value={settings.autoSaveDelay} onChange={(value) => setSetting('autoSaveDelay', value)} />
                         </SettingsRow>
                          <SettingsRow label={t('settings.editor.fontSize')}>
                            <SegmentedControl options={[{label: t('settings.editor.fontSizes.small'), value: 'small'}, {label: t('settings.editor.fontSizes.medium'), value: 'medium'}, {label: t('settings.editor.fontSizes.large'), value: 'large'}]} value={settings.editorFontSize} onChange={(value) => setSetting('editorFontSize', value)} />
                         </SettingsRow>
                         <SettingsRow label={t('settings.editor.defaultView')}>
                            <SegmentedControl options={[{label: t('editor.edit'), value: 'edit'}, {label: t('editor.preview'), value: 'preview'}]} value={settings.defaultEditorView} onChange={(value) => setSetting('defaultEditorView', value)} />
                         </SettingsRow>
                          <SettingsRow label={t('settings.editor.focusMode')}>
                           <ToggleSwitch checked={settings.focusMode} onChange={(checked) => setSetting('focusMode', checked)} />
                        </SettingsRow>
                         <SettingsRow label={t('settings.editor.showWordCount')}>
                           <ToggleSwitch checked={settings.showWordCount} onChange={(checked) => setSetting('showWordCount', checked)} />
                        </SettingsRow>
                    </div>
                )}
                {activeTab === 'ai' && (
                     <div className="space-y-6">
                        <SettingsRow label={t('aiPanel.analysis.settings.summaryLength')}>
                            <SegmentedControl options={[{label: t('aiPanel.analysis.settings.short'), value: 'short'}, {label: t('aiPanel.analysis.settings.detailed'), value: 'detailed'}]} value={settings.aiAgentDefaults.summaryLength} onChange={v => setAiSetting('summaryLength', v)} />
                        </SettingsRow>
                        <SettingsRow label={t('aiPanel.creative.settings.ideaCount')}>
                            <SegmentedControl options={[{label: '3', value: 3}, {label: '5', value: 5}, {label: '7', value: 7}]} value={settings.aiAgentDefaults.ideaCount} onChange={v => setAiSetting('ideaCount', v)} />
                        </SettingsRow>
                        <SettingsRow label={t('aiPanel.translate.settings.targetLanguage')}>
                            <select value={settings.aiAgentDefaults.targetLanguage} onChange={e => setAiSetting('targetLanguage', e.target.value as AiAgentSettings['targetLanguage'])} className="w-40 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm">
                                {AVAILABLE_LANGUAGES.map(lang => (
                                    <option key={lang.value} value={lang.value}>{t(lang.labelKey)}</option>
                                ))}
                            </select>
                        </SettingsRow>
                    </div>
                )}
                 {activeTab === 'data' && (
                    <div className="space-y-6">
                       <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('settings.data.export.title')}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{t('settings.data.export.description')}</p>
                            <div className="flex gap-2 mb-3">
                                {(['all', 'notes', 'templates', 'settings'] as const).map(type => (
                                    <button key={type} onClick={() => setExportType(type)} className={`w-full text-xs rounded-md py-1 capitalize transition-colors ${exportType === type ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                                        {t(`settings.data.export.types.${type}`)}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => onExport(exportType)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                                <FileDown className="h-4 w-4" /> {t('settings.data.export.button')}
                            </button>
                        </div>
                         <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('settings.data.import.title')}</h3>
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 p-3 rounded-md mb-4 text-sm">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                    <p><span className="font-bold">{t('warning')}:</span> {t('settings.data.import.warning')}</p>
                                </div>
                            </div>
                             <input type="file" accept=".json,application/json" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/50 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-900" />
                            <button onClick={handleImportClick} disabled={!file} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                                <FileUp className="h-4 w-4" /> {t('settings.data.import.button')}
                            </button>
                         </div>
                    </div>
                )}
            </div>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-100 dark:bg-slate-950/50 rounded-b-lg">
            <button onClick={resetSettings} className="text-sm text-slate-500 hover:text-red-500 hover:underline">
                {t('settings.reset')}
            </button>
        </div>
      </div>
    </div>
  );
};

const SettingsRow: React.FC<{label: string; children: React.ReactNode; direction?: 'row' | 'col'}> = ({ label, children, direction='row' }) => (
    <div className={`flex justify-between items-center ${direction === 'col' ? 'flex-col items-start gap-2' : ''}`}>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <div>{children}</div>
    </div>
);

const SegmentedControl: React.FC<{options: {label: string, value: any}[], value: any, onChange: (value: any) => void}> = ({ options, value, onChange }) => (
    <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
        {options.map(opt => (
            <button key={opt.label} onClick={() => onChange(opt.value)} className={`text-xs rounded-sm px-3 py-1 transition-colors ${value === opt.value ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'}`}>
                {opt.label}
            </button>
        ))}
    </div>
);

const ToggleSwitch: React.FC<{checked: boolean, onChange: (checked: boolean) => void}> = ({ checked, onChange }) => (
     <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
);


export default SettingsModal;
```

---

### `components/TaskView.tsx`

```tsx
import React, { useMemo, useState } from 'react';
import { Task } from '../types';
import { useNotes } from '../contexts/NoteContext';
import { CheckSquare, ChevronLeft, Notebook } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface TaskViewProps {
  onSelectNote: (id: string) => void;
}

const TaskView: React.FC<TaskViewProps> = ({ onSelectNote }) => {
  const { tasks: allTasks, updateTaskInNote } = useNotes();
  const { t, locale } = useLocale();
  const [showCompleted, setShowCompleted] = useState(false);
  
  const completedTasks = useMemo(() => allTasks.filter(t => t.done), [allTasks]);

  const groupedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups: { [key: string]: Task[] } = {
        [t('tasks.groups.overdue')]: [],
        [t('tasks.groups.today')]: [],
        [t('tasks.groups.upcoming')]: [],
        [t('tasks.groups.noDate')]: [],
    };

    allTasks.forEach(task => {
        if(task.done) return; // Don't show completed tasks in date groups

        if (task.dueDate) {
            try {
                const dueDate = new Date(task.dueDate);
                // Adjust for timezone offset to compare dates correctly
                dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
                dueDate.setHours(0,0,0,0);
                if (dueDate < today) {
                    groups[t('tasks.groups.overdue')].push(task);
                } else if (dueDate.getTime() === today.getTime()) {
                    groups[t('tasks.groups.today')].push(task);
                } else {
                    groups[t('tasks.groups.upcoming')].push(task);
                }
            } catch(e) {
                 groups[t('tasks.groups.noDate')].push(task);
            }
        } else {
            groups[t('tasks.groups.noDate')].push(task);
        }
    });

    // Sort tasks within groups
    groups[t('tasks.groups.overdue')].sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    groups[t('tasks.groups.upcoming')].sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    return groups;
  }, [allTasks, t]);


  const renderTaskItem = (task: Task) => {
    const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : null;

    return (
      <li key={task.id} className="group flex items-start p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex-shrink-0 pt-0.5">
            <input
                type="checkbox"
                checked={task.done}
                onChange={() => updateTaskInNote(task)}
                onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking checkbox
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-transparent"
                aria-label={task.text}
            />
        </div>
        <div 
            className="ml-3 flex-grow cursor-pointer"
            onClick={() => onSelectNote(task.noteId)}
        >
            <div className="flex justify-between items-center">
                <span className={`text-sm ${task.done ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {task.text}
                </span>
                {formattedDate && (
                     <span className={`ml-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full whitespace-nowrap ${task.done ? 'opacity-60' : ''}`}>
                        {formattedDate}
                    </span>
                )}
            </div>
            <div className="text-xs text-slate-400 group-hover:text-primary-500 transition-colors flex items-center gap-1.5 mt-0.5">
                <Notebook className="h-3 w-3" />
                <span className="truncate" title={task.noteTitle}>{task.noteTitle}</span>
            </div>
        </div>
      </li>
    );
  };

  if (allTasks.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 flex-1">
        <CheckSquare className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-lg font-semibold">{t('tasks.empty.title')}</h3>
        <p className="mt-1 text-sm">{t('tasks.empty.description1')}</p>
        <p className="mt-1 text-sm">{t('tasks.empty.description2')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {Object.entries(groupedTasks).map(([groupName, tasks]) => (
        tasks.length > 0 && (
            <div key={groupName} className="mb-4">
                <h3 className="font-semibold text-sm text-slate-500 dark:text-slate-400 px-2 py-1 uppercase tracking-wider">{groupName}</h3>
                <ul className="space-y-0.5">
                    {tasks.map(renderTaskItem)}
                </ul>
            </div>
        )
      ))}
      {completedTasks.length > 0 && (
        <div className="mt-4">
            <button 
                onClick={() => setShowCompleted(!showCompleted)} 
                className="w-full flex justify-between items-center px-2 py-1 text-left rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
                aria-expanded={showCompleted}
            >
                <h3 className="font-semibold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('tasks.groups.completed')} ({completedTasks.length})
                </h3>
                <ChevronLeft className={`h-4 w-4 text-slate-400 transition-transform ${showCompleted ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            {showCompleted && (
                <ul className="space-y-0.5 mt-2">
                    {completedTasks.map(renderTaskItem)}
                </ul>
            )}
        </div>
    )}
    </div>
  );
};

export default React.memo(TaskView);
```

---

### `components/ConfirmDeleteModal.tsx`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Note } from '../types';
import { X, AlertTriangle } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, note, onClose, onConfirm }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsEntering(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the cancel button by default as it's a less destructive action
    const cancelButton = modalRef.current?.querySelector<HTMLButtonElement>('.cancel-button');
    cancelButton?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  if (!isOpen || !note) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" 
        aria-modal="true"
        role="dialog"
    >
      <div 
        ref={modalRef}
        className={`bg-slate-50 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md m-4 transition-all duration-200 ease-out ${isEntering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="flex items-start justify-between p-4 border-b border-slate-200 dark:border-slate-800">
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    {t('deleteModal.title')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('deleteModal.description')}
                </p>
             </div>
            <button onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800" aria-label={t('deleteModal.close')}>
                <X className="h-5 w-5" />
            </button>
        </div>
        
        <div className="p-4">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{note.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {note.content.substring(0, 100) || t('noteList.noContent')}
            </p>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-100 dark:bg-slate-950/50 rounded-b-lg">
            <button
                onClick={onClose}
                className="cancel-button px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
                {t('cancel')}
            </button>
            <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
                {t('delete')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
```

---

### `components/TemplateView.tsx`

```tsx
import React, { useState } from 'react';
import { useNotes } from '../contexts/NoteContext';
import { LayoutTemplate, Trash2, Plus } from './icons';
import SearchNotes from './SearchNotes'; // Re-using search component
import { useLocale } from '../contexts/LocaleContext';

interface TemplateViewProps {
    onUseTemplate: (content: string, title: string) => void;
}

const TemplateView: React.FC<TemplateViewProps> = ({ onUseTemplate }) => {
    const { templates, deleteTemplate } = useNotes();
    const { t } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTemplates = templates.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                <SearchNotes query={searchQuery} onQueryChange={setSearchQuery} />
            </div>
             <div className="flex-1 overflow-y-auto">
                {filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => (
                         <div
                            key={template.id}
                            className="group cursor-pointer p-3 m-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors relative"
                        >
                            <div className="flex items-center" onClick={() => onUseTemplate(template.content, template.title)}>
                                <LayoutTemplate className="h-4 w-4 text-slate-500 mr-3" />
                                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{template.title}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTemplate(template.id);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50 dark:hover:text-red-400 opacity-0 group-hover:opacity-100"
                                aria-label={t('templates.delete')}
                                title={t('templates.delete')}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-8 text-slate-500">
                         <LayoutTemplate className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-lg font-semibold">{t('templates.empty.title')}</h3>
                        <p className="mt-1 text-sm">{t('templates.empty.description')}</p>
                    </div>
                )}
             </div>
        </div>
    )
}

export default React.memo(TemplateView);
```

---

### `components/IconPicker.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import * as Icons from './icons';

interface IconPickerProps {
    onSelect: (iconName: string) => void;
    onClose: () => void;
}

const iconList = [
    'NotebookPen', 'Sparkles', 'Lightbulb', 'BrainCircuit', 'BookOpenCheck',
    'CheckSquare', 'GanttChartSquare', 'Rocket', 'Target', 'Goal', 'Flag',
    'Award', 'Trophy', 'Medal', 'Gift', 'Heart', 'Star', 'Home', 'Users',
    'User', 'Briefcase', 'Folder', 'FileText', 'Calendar', 'Clock',
    'Code', 'TerminalSquare', 'Database', 'Server', 'Cloud', 'Globe',
    'MapPin', 'Compass', 'Coffee', 'Pizza', 'CookingPot', 'BookHeart',
    'Music', 'Film', 'Camera', 'Palette', 'GraduationCap', 'FlaskConical',
    'Atom', 'Bug', 'Construction', 'Plane', 'Ship', 'Car', 'Bike',
    'Megaphone', 'MessageSquare', 'Mail', 'Link', 'Shield', 'Key', 'Lock'
];

const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const filteredIcons = iconList.filter(name => name.toLowerCase().includes(search.toLowerCase()));
    
    return (
        <div ref={pickerRef} className="absolute z-20 -left-4 top-14 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 p-2">
            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full px-2 py-1 mb-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                autoFocus
            />
            <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                {filteredIcons.map(iconName => {
                    const IconComponent = (Icons as any)[iconName];
                    return (
                        <button
                            key={iconName}
                            onClick={() => onSelect(iconName)}
                            title={iconName}
                            className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                        >
                            <IconComponent className="h-5 w-5" />
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default IconPicker;
```

---

### `components/HelpCenter.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import * as Icons from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'guide' | 'faq' | 'glossary' | 'whats-new';

// Memoized inline icons for performance
const IconPin = React.memo(() => <Icons.Pin className="inline h-4 w-4"/>);
const IconSmile = React.memo(() => <Icons.SmilePlus className="inline h-4 w-4"/>);
const IconSave = React.memo(() => <Icons.Save className="inline h-4 w-4"/>);
const IconBlog = React.memo(() => <Icons.BookCopy className="inline h-4 w-4"/>);
const IconMeeting = React.memo(() => <Icons.GanttChartSquare className="inline h-4 w-4"/>);
const IconSettings = React.memo(() => <Icons.Settings className="inline h-4 w-4"/>);
const IconLink = React.memo(() => <Icons.Link className="inline h-4 w-4"/>);


const HelpCenter: React.FC<HelpCenterProps> = ({ isOpen, onClose }) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('guide');
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsEntering(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the first focusable element
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'guide', label: t('help.tabs.guide'), icon: <Icons.BookText className="h-4 w-4" /> },
    { id: 'faq', label: t('help.tabs.faq'), icon: <Icons.CircleHelp className="h-4 w-4" /> },
    { id: 'glossary', label: t('help.tabs.glossary'), icon: <Icons.NotebookPen className="h-4 w-4" /> },
    { id: 'whats-new', label: t('help.tabs.whatsNew'), icon: <Icons.Megaphone className="h-4 w-4" /> },
  ];

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" 
        aria-modal="true"
        role="dialog"
    >
      <div ref={modalRef} className={`bg-slate-50 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] flex flex-col transition-all duration-200 ease-out ${isEntering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icons.HelpCircle className="h-7 w-7" />
                {t('help.title')}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800" aria-label={t('help.close')}>
                <Icons.X className="h-5 w-5" />
            </button>
        </div>
        
        <div className="flex p-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex-grow flex justify-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-1/3 py-2 px-4 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
            </div>
        </div>
        
        <div className="p-6 overflow-y-auto prose prose-slate dark:prose-invert max-w-none">
            {activeTab === 'guide' && <Guide />}
            {activeTab === 'faq' && <FAQ />}
            {activeTab === 'glossary' && <Glossary />}
            {activeTab === 'whats-new' && <WhatsNew />}
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{title: string; icon: React.ReactNode; children: React.ReactNode}> = ({title, icon, children}) => (
    <div className="mb-8 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-100/50 dark:bg-slate-950/50 not-prose">
        <h3 className="flex items-center gap-2 font-bold text-xl mb-3 text-slate-800 dark:text-slate-200">
            <span className="text-primary-500">{icon}</span>
            {title}
        </h3>
        <div className="space-y-2 text-slate-700 dark:text-slate-300 text-base">{children}</div>
    </div>
)

const Guide = () => {
    const { t } = useLocale();
    return (
        <div>
            <h2 className="font-bold text-2xl mb-4">{t('help.guide.title')}</h2>
            <p>{t('help.guide.intro')}</p>
            
            <Section title={t('help.guide.basics.title')} icon={<Icons.Notebook />}>
                <p><strong>{t('help.guide.basics.create.title')}:</strong> {t('help.guide.basics.create.description')}</p>
                <p><strong>{t('help.guide.basics.edit.title')}:</strong> {t('help.guide.basics.edit.description')}</p>
                <p><strong>{t('help.guide.basics.pin.title')}:</strong> {t('help.guide.basics.pin.description')} <IconPin /></p>
                <p><strong>{t('help.guide.basics.personalize.title')}:</strong> {t('help.guide.basics.personalize.description')} <IconSmile /></p>
            </Section>

            <Section title={t('help.guide.linking.title')} icon={<IconLink/>}>
                 <p>{t('help.guide.linking.description1')}</p>
                 <p><code>[[{t('help.guide.linking.example')}]]</code></p>
                 <p>{t('help.guide.linking.description2')}</p>
            </Section>
            
            <Section title={t('help.guide.tasks.title')} icon={<Icons.CheckSquare />}>
                <p>{t('help.guide.tasks.intro')}:</p>
                <ul className="list-disc pl-5">
                    <li><code>- [ ] {t('help.guide.tasks.open')}</code></li>
                    <li><code>- [x] {t('help.guide.tasks.completed')}</code></li>
                </ul>
                <p><strong>{t('help.guide.tasks.dueDate.title')}:</strong> {t('help.guide.tasks.dueDate.description')}</p>
                <p><strong>{t('help.guide.tasks.view.title')}:</strong> {t('help.guide.tasks.view.description')}</p>
            </Section>

            <Section title={t('help.guide.templates.title')} icon={<Icons.LayoutTemplate />}>
                <p><strong>{t('help.guide.templates.use.title')}:</strong> {t('help.guide.templates.use.description')}</p>
                <p><strong>{t('help.guide.templates.save.title')}:</strong> {t('help.guide.templates.save.description')} <IconSave /> "{t('editor.saveAsTemplate')}"</p>
                <p><strong>{t('help.guide.templates.manage.title')}:</strong> {t('help.guide.templates.manage.description')}</p>
            </Section>
            
            <Section title={t('help.guide.ai.title')} icon={<Icons.BrainCircuit />}>
                <p>{t('help.guide.ai.intro')}</p>
                <ul className="list-disc pl-5">
                    <li><strong>{t('help.guide.ai.recipes.title')}:</strong> {t('help.guide.ai.recipes.description')} (<IconBlog />) {t('help.guide.ai.recipes.or')} (<IconMeeting />).</li>
                    <li><strong>{t('aiPanel.analysis.title')}:</strong> {t('help.guide.ai.analysis')}</li>
                    <li><strong>{t('aiPanel.creative.title')}:</strong> {t('help.guide.ai.creative')}</li>
                    <li><strong>{t('aiPanel.image.title')}:</strong> {t('help.guide.ai.image')}</li>
                    <li><strong>{t('aiPanel.plan.title')}:</strong> {t('help.guide.ai.plan')}</li>
                    <li>... {t('help.guide.ai.more')}</li>
                </ul>
            </Section>
            
            <Section title={t('help.guide.graph.title')} icon={<Icons.Share2 />}>
                <p>{t('help.guide.graph.description1')}</p>
                <p>{t('help.guide.graph.description2')}</p>
            </Section>
            
            <Section title={t('help.guide.history.title')} icon={<Icons.History />}>
                <p>{t('help.guide.history.description')}</p>
            </Section>
        </div>
    );
}

const FAQ = () => {
    const { t } = useLocale();
    return (
    <div>
        <h2 className="font-bold text-2xl mb-4">{t('help.faq.title')}</h2>
        
        <div className="mb-6">
            <h4 className="font-semibold text-lg">{t('help.faq.q1.question')}</h4>
            <p>{t('help.faq.q1.answer')}</p>
        </div>

        <div className="mb-6">
            <h4 className="font-semibold text-lg">{t('help.faq.q2.question')}</h4>
            <p>{t('help.faq.q2.answer')}</p>
        </div>

        <div className="mb-6">
            <h4 className="font-semibold text-lg">{t('help.faq.q3.question')}</h4>
            <p>{t('help.faq.q3.answer')} <IconSettings /></p>
        </div>
        
        <div className="mb-6">
            <h4 className="font-semibold text-lg">{t('help.faq.q4.question')}</h4>
            <p>{t('help.faq.q4.answer')}</p>
        </div>
    </div>
    );
};

const Glossary = () => {
    const { t } = useLocale();
    return (
    <div>
        <h2 className="font-bold text-2xl mb-4">{t('help.glossary.title')}</h2>
        <dl>
            <dt className="font-semibold">{t('help.glossary.term1.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term1.definition')}</dd>
            
            <dt className="font-semibold">{t('help.glossary.term2.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term2.definition')}</dd>
            
            <dt className="font-semibold">{t('help.glossary.term3.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term3.definition')}</dd>

            <dt className="font-semibold">{t('help.glossary.term4.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term4.definition')}</dd>
            
            <dt className="font-semibold">{t('help.glossary.term5.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term5.definition')}</dd>
        </dl>
    </div>
    );
};

const WhatsNew = () => {
    const { t } = useLocale();
    return (
    <div>
        <h2 className="font-bold text-2xl mb-4">{t('help.whatsNew.title')}</h2>
        <p>{t('help.whatsNew.intro')}</p>

        <Section title={t('help.whatsNew.feature1.title')} icon={<Icons.Megaphone />}>
            <p>{t('help.whatsNew.feature1.description1')}</p>
            <p>{t('help.whatsNew.feature1.description2')}</p>
        </Section>
        
        <Section title={t('help.whatsNew.feature2.title')} icon={<Icons.CheckCircle2 />}>
            <p>{t('help.whatsNew.feature2.