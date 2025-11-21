

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

// Union type for all possible AI Agent results
export type AiAgentData = 
    | { summary: string; tags: string[] }
    | BrainstormSuggestion
    | PlannerSuggestion
    | ResearchSuggestion
    | TranslateSuggestion
    | FormatSuggestion
    | ImageSuggestion
    | AiRecipeResult;

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

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// --- App Settings Interfaces ---

export interface AiAgentSettings {
    summaryLength: 'short' | 'detailed';
    ideaCount: 3 | 5 | 7;
    planDetail: 'simple' | 'detailed';
    targetLanguage: 'English' | 'German';
    imageStyle: 'default' | 'photorealistic' | 'watercolor' | 'anime';
    imageAspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16';
}

export const AVAILABLE_LANGUAGES: { value: AiAgentSettings['targetLanguage'], labelKey: string }[] = [
    { value: 'English', labelKey: 'languages.english' },
    { value: 'German', labelKey: 'languages.german' }
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

export interface ImportData {
    notes?: Note[];
    templates?: Template[];
    settings?: AppSettings;
}