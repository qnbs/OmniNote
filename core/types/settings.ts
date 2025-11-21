
import { AiAgentSettings } from './ai';
import { Note, Template } from './note';

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

export interface ImportData {
    notes?: Note[];
    templates?: Template[];
    settings?: AppSettings;
}
