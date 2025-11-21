
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
    className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0"
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
    <div className="flex items-center gap-1 p-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
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
