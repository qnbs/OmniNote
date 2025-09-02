


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
