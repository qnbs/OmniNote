
import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Note } from '../types';
import { Eye, Pencil, Save, SmilePlus, ChevronDown, FileDown, ChevronLeft } from './icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNotes } from '../contexts/NoteContext';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import NoteEditorToolbar from './NoteEditorToolbar';
import IconPicker from './IconPicker';
import { useLocale } from '../contexts/LocaleContext';
import { WIKI_LINK_REGEX, findNoteByTitle } from '../utils/noteUtils';

interface HighlightJs {
    highlightElement: (block: HTMLElement) => void;
}
declare const hljs: HighlightJs;

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
        if(typeof hljs !== 'undefined') {
            previewRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }

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
      return sanitizedHtml.replace(WIKI_LINK_REGEX, (match, linkTitle) => {
        const linkedNote = findNoteByTitle(allNotes, linkTitle);
        if (linkedNote) {
          return `<a href="#" data-note-id="${linkedNote.id}" class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-1 py-0.5 rounded hover:underline font-medium transition-colors">${linkTitle}</a>`;
        } else {
          return `<span class="text-red-500 bg-red-50 dark:bg-red-900/20 px-1 py-0.5 rounded border border-red-100 dark:border-red-900/30 cursor-help" title="${t('editor.brokenLinkTitle')}">${linkTitle}</span>`;
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
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col p-2 sm:px-6 sm:pt-4 sm:pb-2">
            <div className='flex justify-between items-start gap-2 sm:gap-4'>
                <button 
                    onClick={() => onSelectNote('')} 
                    className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 mr-1 flex-shrink-0"
                    aria-label={t('back')}
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                <div className="relative flex-1 flex items-center group min-w-0">
                    <button 
                        onClick={() => setIconPickerOpen(true)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 mr-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                        aria-label={t('editor.chooseIcon')}
                    >
                        <SmilePlus className="h-6 w-6" />
                    </button>
                    {isIconPickerOpen && <IconPicker onSelect={handleIconSelect} onClose={() => setIconPickerOpen(false)} />}
                    
                    <input
                        ref={titleRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('editor.titlePlaceholder')}
                        className={`w-full text-lg sm:text-2xl md:text-3xl font-bold bg-transparent focus:outline-none placeholder-slate-300 dark:placeholder-slate-700 text-slate-900 dark:text-white truncate ${fontClasses[settings.font]}`}
                    />
                </div>
            
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                        <button
                        onClick={() => setViewMode('edit')}
                        aria-pressed={viewMode === 'edit'}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title={t('editor.edit')}
                        >
                        <Pencil className="h-4 w-4" />
                        </button>
                        <button
                        onClick={() => setViewMode('preview')}
                        aria-pressed={viewMode === 'preview'}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title={t('editor.preview')}
                        >
                        <Eye className="h-4 w-4" />
                        </button>
                    </div>
                    
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setMenuOpen(!isMenuOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 transition-colors">
                            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button onClick={handleSaveAsTemplate} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                                    <Save className="h-4 w-4 text-slate-400" /> {t('editor.saveAsTemplate')}
                                </button>
                                <button onClick={handleExportMarkdown} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3">
                                    <FileDown className="h-4 w-4 text-slate-400" /> {t('editor.exportMarkdown')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Inline Toolbar for Edit Mode */}
            {viewMode === 'edit' && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    <NoteEditorToolbar onApplyMarkdown={applyMarkdown} />
                </div>
            )}
          </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
          {viewMode === 'edit' ? (
            <textarea
                ref={contentRef}
                value={content}
                onScroll={() => syncScroll('editor')}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('editor.contentPlaceholder')}
                className={`
                    flex-1 w-full h-full bg-transparent focus:outline-none resize-none leading-relaxed p-4 sm:px-8 sm:py-6 overflow-y-auto
                    ${fontClasses[settings.font]}
                    ${fontSizeClasses[settings.editorFontSize]}
                    ${settings.focusMode ? 'focus-mode' : ''}
                `}
                aria-label={t('editor.contentAriaLabel')}
            />
          ) : (
            <div
              ref={previewRef}
              onScroll={() => syncScroll('preview')}
              className={`prose prose-slate dark:prose-invert max-w-3xl mx-auto w-full p-4 sm:px-8 sm:py-6 overflow-y-auto h-full ${fontClasses[settings.font]} ${fontSizeClasses[settings.editorFontSize]}`}
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          )}
          
          <style>{`
                .focus-mode:focus {
                    color: inherit;
                }
                .focus-mode {
                    color: #94a3b8; /* slate-400 */
                    transition: color 0.3s ease;
                }
          `}</style>
      </div>
        {settings.showWordCount && (
            <div className="py-2 px-6 border-t border-slate-100 dark:border-slate-900 text-[10px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-600 flex justify-end gap-4 bg-white dark:bg-slate-950">
                <span>{t('editor.words')}: {wordCount}</span>
                <span className="text-slate-200 dark:text-slate-800">|</span>
                <span>{t('editor.characters')}: {charCount}</span>
                <span className="text-slate-200 dark:text-slate-800">|</span>
                <span>{t('editor.lastUpdated')}: {formattedDate}</span>
            </div>
        )}
    </div>
  );
});

export default NoteEditor;