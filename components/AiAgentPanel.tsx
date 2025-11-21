
import React, { useState, useCallback, useReducer, useRef, useEffect, useMemo } from 'react';
import { Note, TagSuggestion, SummarySuggestion, BrainstormSuggestion, ResearchSuggestion, PlannerSuggestion, TranslateSuggestion, FormatSuggestion, ImageSuggestion, AiRecipeResult, AiAgentSettings, AVAILABLE_LANGUAGES, ChatMessage, AiAgentData } from '../types';
import * as geminiService from '../services/geminiService';
import { BrainCircuit, Lightbulb, Search, Loader2, AlertTriangle, Plus, Copy, CheckSquare, Settings, Languages, Wand2, Image, Replace, BookCopy, GanttChartSquare, Sparkles, Megaphone, ChevronLeft, MessageSquare, Send, Trash2 } from './icons';
import { useToast } from '../contexts/ToastContext';
import { useNotes } from '../contexts/NoteContext';
import { useLocale } from '../contexts/LocaleContext';
import { useSettings } from '../contexts/SettingsContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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

// --- Helper Component for Markdown Rendering ---
const MarkdownResult: React.FC<{ content: string, className?: string }> = React.memo(({ content, className = '' }) => {
    const cleanHtml = useMemo(() => {
        const rawHtml = marked.parse(content) as string;
        return DOMPurify.sanitize(rawHtml);
    }, [content]);

    return (
        <div 
            className={`prose prose-sm prose-slate dark:prose-invert max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
    );
});

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
  chatMessages: ChatMessage[];
  localConfig: AiAgentSettings;
}

type AiPanelAction =
  | { type: 'RUN_AGENT'; payload: { name: string | null } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'SET_RESULT'; payload: { agent: string; data: AiAgentData } }
  | { type: 'CLEAR_RESULTS'; payload: { agent: string } }
  | { type: 'SET_LOCAL_CONFIG'; payload: { key: keyof AiAgentSettings; value: AiAgentSettings[keyof AiAgentSettings] } }
  | { type: 'RESET_LOCAL_CONFIG'; payload: { config: AiAgentSettings } }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LAST_CHAT_MESSAGE'; payload: { text: string } }
  | { type: 'CLEAR_CHAT' };

function aiPanelReducer(state: AiPanelState, action: AiPanelAction): AiPanelState {
  switch (action.type) {
    case 'RUN_AGENT':
      return { ...state, loadingAgent: action.payload.name, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload.error, loadingAgent: null };
    case 'SET_RESULT': {
        const data = action.payload.data;
        switch (action.payload.agent) {
            case 'analysis':
                if (data && 'summary' in data && 'tags' in data) {
                    return { ...state, summary: data.summary, tags: data.tags };
                }
                return state;
            case 'brainstorm':
                if (data && 'ideas' in data) {
                    return { ...state, ideas: data.ideas };
                }
                return state;
            case 'plan':
                if (data && 'tasks' in data) {
                    return { ...state, plan: data.tasks };
                }
                return state;
            case 'research':
                if (data && 'answer' in data && 'sources' in data) {
                    return { ...state, research: data as ResearchSuggestion };
                }
                return state;
            case 'translate':
                if (data && 'translatedText' in data) {
                    return { ...state, translation: data as TranslateSuggestion };
                }
                return state;
            case 'format':
                if (data && 'formattedText' in data) {
                    return { ...state, formatted: data as FormatSuggestion };
                }
                return state;
            case 'image':
                if (data && 'imageBytes' in data) {
                    return { ...state, image: data as ImageSuggestion };
                }
                return state;
            case 'recipe-blog':
            case 'recipe-meeting':
            case 'recipe-social':
                if (data && 'title' in data && 'content' in data) {
                    return { ...state, recipeResult: data as AiRecipeResult };
                }
                return state;
            default:
                return state;
        }
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
    case 'ADD_CHAT_MESSAGE':
        return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'UPDATE_LAST_CHAT_MESSAGE': {
        const newMessages = [...state.chatMessages];
        if (newMessages.length > 0) {
            const lastMessage = newMessages[newMessages.length - 1];
            newMessages[newMessages.length - 1] = { ...lastMessage, text: action.payload.text };
        }
        return { ...state, chatMessages: newMessages };
    }
    case 'CLEAR_CHAT':
        return { ...state, chatMessages: [] };
    default:
      return state;
  }
}

interface AiAgentPanelProps {
  activeNote: Note | null;
}

const Divider = () => <hr className="border-slate-200 dark:border-slate-800 my-2" />;

const LoadingPlaceholder: React.FC<{ text: string }> = ({ text }) => (
    <div className="mt-2 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
        <Loader2 className="h-5 w-5 animate-spin mb-2 text-primary-500" />
        <p className="font-medium">{text}</p>
    </div>
);

const ImagePlaceholder: React.FC<{ aspectRatio: AiAgentSettings['imageAspectRatio'] }> = ({ aspectRatio }) => {
    const { t } = useLocale();
    return (
        <div className={`mt-2 w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 animate-pulse flex flex-col items-center justify-center text-slate-500 ${aspectRatioStyles[aspectRatio]}`}>
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <p className="mt-2 text-sm font-medium">{t('aiPanel.image.generating')}</p>
        </div>
    );
};

const StreamingResult: React.FC<{ text: string }> = ({ text }) => (
    <div className="text-sm bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-wrap font-sans mt-3 leading-relaxed shadow-sm animate-in fade-in">
      {text}
      <span className="inline-block w-1.5 h-3 bg-primary-500 animate-pulse ml-1 align-middle" />
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
    chatMessages: [],
    localConfig: settings.aiAgentDefaults,
  };

  const [state, dispatch] = useReducer(aiPanelReducer, initialState);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { t, locale } = useLocale();
  const { loadingAgent, error, summary, tags, ideas, plan, research, translation, formatted, image, recipeResult, chatMessages, localConfig } = state;
  const { summaryLength, ideaCount, planDetail, targetLanguage, imageStyle, imageAspectRatio } = localConfig;
  
  const [streamingText, setStreamingText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const isApiKeySet = !!process.env.API_KEY;

  useEffect(() => {
    dispatch({ type: 'RESET_LOCAL_CONFIG', payload: { config: settings.aiAgentDefaults }});
  }, [settings.aiAgentDefaults]);

  useEffect(() => {
      if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [chatMessages, loadingAgent]);

  useEffect(() => {
      dispatch({ type: 'CLEAR_CHAT' });
  }, [activeNote?.id]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const setConfig = <K extends keyof AiAgentSettings>(key: K, value: AiAgentSettings[K]) => {
      dispatch({ type: 'SET_LOCAL_CONFIG', payload: { key, value } });
      setAiSetting(key, value);
  }

  const runAgent = useCallback(async (agentName: string, agentFunction: (onChunk?: (chunk: string) => void) => Promise<AiAgentData>, stream: boolean = false) => {
    if (!activeNote || !activeNote.content) {
      addToast(t('toast.noteHasNoContent'), 'error');
      return;
    }

    if (agentName === 'analysis') {
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'summary' } });
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'tags' } });
    } else if (agentName === 'brainstorm') {
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'ideas' } });
    } else if (agentName === 'plan') {
        dispatch({ type: 'CLEAR_RESULTS', payload: { agent: 'plan' } });
    } else if (agentName === 'research') {
        dispatch({ type: 'SET_RESULT', payload: { agent: 'research', data: null as any } }); // Reset
    } else if (agentName === 'translate') {
        dispatch({ type: 'SET_RESULT', payload: { agent: 'translate', data: null as any } });
    } else if (agentName === 'format') {
        dispatch({ type: 'SET_RESULT', payload: { agent: 'format', data: null as any } });
    } else if (agentName === 'image') {
        dispatch({ type: 'SET_RESULT', payload: { agent: 'image', data: null as any } });
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
         if (result) {
             dispatch({ type: 'SET_RESULT', payload: { agent: agentName, data: result } });
         }
      }
    } catch (e: unknown) {
      let errorMessage = t('aiPanel.error.prefix', { agentName });
      if (e instanceof Error) {
          errorMessage = e.message || errorMessage;
      }
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
    if (!activeNote) return Promise.resolve(null);
    if(onChunk) {
        await geminiService.getSummaryStream(activeNote.content, { length: summaryLength }, locale, onChunk);
        return null;
    }
    return await geminiService.getSummaryAndTags(activeNote.content, { length: summaryLength }, locale);
  }, [activeNote, summaryLength, locale]);

  const handleBrainstorm = useCallback(async (onChunk?: (chunk: string) => void) => {
    if (!activeNote) return Promise.resolve(null);
    if(onChunk) {
        await geminiService.getBrainstormingIdeasStream(activeNote.content, { count: ideaCount }, locale, onChunk);
        return null;
    }
    return await geminiService.getBrainstormingIdeas(activeNote.content, { count: ideaCount }, locale);
  }, [activeNote, ideaCount, locale]);

  const handlePlan = useCallback(async (onChunk?: (chunk: string) => void) => {
    if (!activeNote) return Promise.resolve(null);
     if(onChunk) {
        await geminiService.getTaskPlanStream(activeNote.content, { detail: planDetail }, locale, onChunk);
        return null;
    }
    return await geminiService.getTaskPlan(activeNote.content, { detail: planDetail }, locale);
  }, [activeNote, planDetail, locale]);

  const handleResearch = useCallback(async () => {
    if (!activeNote) return Promise.resolve(null);
    return await geminiService.getResearchLinks(activeNote.content, locale);
  }, [activeNote, locale]);

  const handleTranslate = useCallback(async () => {
    if (!activeNote) return Promise.resolve(null);
    return await geminiService.translateNote(activeNote.content, targetLanguage);
  }, [activeNote, targetLanguage]);
  
  const handleFormat = useCallback(async () => {
    if (!activeNote) return Promise.resolve(null);
    return await geminiService.formatNote(activeNote.content);
  }, [activeNote]);

  const handleGenerateImage = useCallback(async () => {
    if (!activeNote) return Promise.resolve(null);
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
      if (!activeNote) return Promise.resolve(null);
      if (recipeName === 'blog') {
          return await geminiService.runBlogPostRecipe(activeNote.title, activeNote.content, locale);
      } else if (recipeName === 'meeting') {
          return await geminiService.runMeetingAnalysisRecipe(activeNote.content, locale);
      } else {
          return await geminiService.runSocialPostRecipe(activeNote.content, locale);
      }
  }, [activeNote, locale]);

  const handleChatSubmit = useCallback(async () => {
      if (!activeNote || !chatInput.trim() || loadingAgent === 'chat') return;
      
      const message = chatInput.trim();
      setChatInput('');
      
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'user', text: message } });
      dispatch({ type: 'RUN_AGENT', payload: { name: 'chat' } });
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'model', text: '' } });

      try {
          let fullResponse = '';
          await geminiService.streamChatWithNote(
              activeNote.content,
              chatMessages, 
              message,
              (chunk) => {
                  fullResponse += chunk;
                  dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: { text: fullResponse } });
              }
          );
      } catch (e: unknown) {
           let errorMessage = t('aiPanel.error.prefix', { agentName: 'Chat' });
           if (e instanceof Error) {
               errorMessage = e.message || errorMessage;
           }
           dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
      } finally {
           dispatch({ type: 'RUN_AGENT', payload: { name: null } });
      }

  }, [activeNote, chatInput, chatMessages, loadingAgent, t]);


  if (!activeNote) {
    return <div className="p-8 text-center text-slate-400 text-sm">{t('aiPanel.selectNote')}</div>;
  }
  
  const isRecipeLoading = loadingAgent && loadingAgent.startsWith('recipe-');
  const isStreaming = loadingAgent && streamingText;

  return (
    <div className="p-4 space-y-4 pb-20">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm animate-in slide-in-from-top-2 fade-in duration-200" role="alert">
          <p className="font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>{t('error')}</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {!isApiKeySet && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-sm">
            <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p><span className="font-bold">{t('warning')}:</span> {t('aiPanel.apiKeyMissing')}</p>
            </div>
        </div>
      )}

      {/* Chat Agent */}
      <AgentSection
        title={t('aiPanel.chat.title')}
        icon={<MessageSquare className="h-4 w-4 text-primary-500" />}
        hideRunButton={true}
        isCollapsed={!!collapsedSections['chat']}
        onToggleCollapse={() => toggleSection('chat')}
        disabled={!isApiKeySet}
      >
        <div className="flex flex-col h-[320px]">
             <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 mb-2 shadow-inner scroll-smooth">
                {chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-xs">{t('aiPanel.chat.placeholder')}</span>
                    </div>
                )}
                {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                             {msg.role === 'model' && !msg.text && loadingAgent === 'chat' && index === chatMessages.length - 1 ? (
                                 <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /></span>
                             ) : (
                                 <MarkdownResult content={msg.text} className={msg.role === 'user' ? 'prose-invert text-white' : ''} />
                             )}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
             </div>
             <div className="flex items-center gap-2">
                <button 
                    onClick={() => dispatch({ type: 'CLEAR_CHAT' })}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                    title={t('aiPanel.chat.clear')}
                    aria-label={t('aiPanel.chat.clear')}
                    disabled={chatMessages.length === 0}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                        placeholder={t('aiPanel.chat.inputPlaceholder')}
                        aria-label={t('aiPanel.chat.inputPlaceholder')}
                        disabled={loadingAgent === 'chat' || !isApiKeySet}
                        className="w-full pl-3 pr-10 py-2 text-sm rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                    <button 
                        onClick={handleChatSubmit}
                        disabled={!chatInput.trim() || loadingAgent === 'chat' || !isApiKeySet}
                        aria-label={t('aiPanel.chat.send')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-90"
                    >
                        <Send className="h-3 w-3" />
                    </button>
                </div>
             </div>
        </div>
      </AgentSection>

      {/* AI Recipes */}
      <AgentSection
        title={t('aiPanel.recipes.title')}
        icon={<Sparkles className="h-4 w-4 text-amber-500" />}
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
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-sm bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-80 overflow-y-auto custom-scrollbar">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 sticky top-0 bg-white dark:bg-slate-950 pb-2 border-b border-slate-100 dark:border-slate-800">{recipeResult.title}</h4>
                  <MarkdownResult content={recipeResult.content} />
              </div>
              <button onClick={() => handleReplaceAll(recipeResult)} className="w-full py-2 text-xs font-medium text-primary-700 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"><Replace className="h-3.5 w-3.5"/> {t('aiPanel.actions.replaceNote')}</button>
            </div>
          )}
        </div>
      </AgentSection>
      
      {/* Analysis Agent */}
      <AgentSection
        title={t('aiPanel.analysis.title')}
        icon={<BrainCircuit className="h-4 w-4 text-purple-500" />}
        onRun={() => runAgent('analysis', handleAnalysis, true)}
        isLoading={loadingAgent === 'analysis'}
        buttonText={t('aiPanel.analysis.button')}
        isCollapsed={!!collapsedSections['analysis']}
        onToggleCollapse={() => toggleSection('analysis')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'analysis' || !isApiKeySet}>
                <div className="text-xs p-2 w-48">
                    <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('aiPanel.analysis.settings.summaryLength')}</label>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setConfig('summaryLength', 'short')} className={`flex-1 py-1 rounded-md transition-all ${summaryLength === 'short' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t('aiPanel.analysis.settings.short')}</button>
                        <button onClick={() => setConfig('summaryLength', 'detailed')} className={`flex-1 py-1 rounded-md transition-all ${summaryLength === 'detailed' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t('aiPanel.analysis.settings.detailed')}</button>
                    </div>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
          {isStreaming && loadingAgent === 'analysis' && <StreamingResult text={streamingText} />}
          {summary && !isStreaming && (
            <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative group">
                <div className="text-sm bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <MarkdownResult content={summary} />
                </div>
                <button onClick={() => handleCopyToClipboard(summary, t('aiPanel.analysis.summary'))} className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm active:scale-90"><Copy className="h-3.5 w-3.5"/></button>
              </div>
              <button onClick={handlePrependSummary} className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">{t('aiPanel.actions.prepend')}</button>
            </div>
          )}
           {tags && tags.length > 0 && !isStreaming && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('aiPanel.analysis.tags')}</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => <span key={tag} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">{tag}</span>)}
                <button onClick={handleApplyTags} className="bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-medium px-2.5 py-1 rounded-full border border-primary-100 dark:border-primary-900 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all active:scale-95 flex items-center gap-1"><Plus className="h-3 w-3" /> {t('aiPanel.actions.addTags')}</button>
              </div>
            </div>
          )}
        </div>
      </AgentSection>

      {/* Creative Agent */}
      <AgentSection
        title={t('aiPanel.creative.title')}
        icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
        onRun={() => runAgent('brainstorm', handleBrainstorm, true)}
        isLoading={loadingAgent === 'brainstorm'}
        buttonText={t('aiPanel.creative.button')}
        isCollapsed={!!collapsedSections['creative']}
        onToggleCollapse={() => toggleSection('creative')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'brainstorm' || !isApiKeySet}>
                <div className="text-xs p-2 w-48">
                    <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('aiPanel.creative.settings.ideaCount')}</label>
                     <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {IDEA_COUNTS.map(num => (
                            <button key={num} onClick={() => setConfig('ideaCount', num)} className={`flex-1 py-1 rounded-md transition-all ${ideaCount === num ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}>{num}</button>
                        ))}
                    </div>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
          {isStreaming && loadingAgent === 'brainstorm' && <StreamingResult text={streamingText} />}
          {ideas && ideas.length > 0 && !isStreaming && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {ideas.map((idea, i) => 
                <div key={i} className="group relative text-sm bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm flex items-start hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                  <span className="mr-3 text-primary-500 mt-0.5">•</span>
                  <p className="flex-1 text-slate-700 dark:text-slate-300">{idea}</p>
                  <button onClick={() => handleCopyToClipboard(idea, t('aiPanel.creative.idea'))} className="ml-2 p-1.5 rounded-md text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all active:scale-90"><Copy className="h-3.5 w-3.5"/></button>
                </div>
              )}
            </div>
          )}
        </div>
      </AgentSection>

        {/* Image Agent */}
      <AgentSection
        title={t('aiPanel.image.title')}
        icon={<Image className="h-4 w-4 text-pink-500" />}
        onRun={() => runAgent('image', handleGenerateImage)}
        isLoading={loadingAgent === 'image'}
        buttonText={t('aiPanel.image.button')}
        isCollapsed={!!collapsedSections['image']}
        onToggleCollapse={() => toggleSection('image')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'image' || !isApiKeySet}>
                <div className="text-xs p-2 w-56 space-y-3">
                    <div>
                        <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">{t('aiPanel.image.settings.style')}</label>
                        <select value={imageStyle} onChange={e => setConfig('imageStyle', e.target.value as AiAgentSettings['imageStyle'])} className="w-full p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 text-xs">
                            {IMAGE_STYLES.map(style => <option key={style.value} value={style.value}>{t(style.labelKey)}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">{t('aiPanel.image.settings.aspectRatio')}</label>
                        <div className="grid grid-cols-3 gap-1">
                            {IMAGE_ASPECT_RATIOS.map(ratio => (
                                <button key={ratio} onClick={() => setConfig('imageAspectRatio', ratio)} className={`px-2 py-1 rounded-md text-xs border transition-all ${imageAspectRatio === ratio ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{ratio}</button>
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
                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={`rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 ${aspectRatioStyles[imageAspectRatio]}`}>
                    <img src={`data:image/png;base64,${image.imageBytes}`} alt={t('aiPanel.image.altText')} className="w-full h-full object-cover" />
                </div>
                <button onClick={handleAppendImage} className="w-full py-2 text-xs font-medium text-primary-700 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"><Plus className="h-3.5 w-3.5" /> {t('aiPanel.actions.append')}</button>
                </div>
            )}
        </div>
      </AgentSection>
      
      {/* Planner Agent */}
      <AgentSection
        title={t('aiPanel.plan.title')}
        icon={<CheckSquare className="h-4 w-4 text-emerald-500" />}
        onRun={() => runAgent('plan', handlePlan, true)}
        isLoading={loadingAgent === 'plan'}
        buttonText={t('aiPanel.plan.button')}
        isCollapsed={!!collapsedSections['plan']}
        onToggleCollapse={() => toggleSection('plan')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'plan' || !isApiKeySet}>
                <div className="text-xs p-2 w-48">
                    <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-300">{t('aiPanel.plan.settings.detail')}</label>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setConfig('planDetail', 'simple')} className={`flex-1 py-1 rounded-md transition-all ${planDetail === 'simple' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t('aiPanel.plan.settings.simple')}</button>
                        <button onClick={() => setConfig('planDetail', 'detailed')} className={`flex-1 py-1 rounded-md transition-all ${planDetail === 'detailed' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t('aiPanel.plan.settings.detailed')}</button>
                    </div>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
          {isStreaming && loadingAgent === 'plan' && <StreamingResult text={streamingText} />}
          {plan && plan.length > 0 && !isStreaming && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {plan.map((task, i) => 
                <div key={i} className="group relative text-sm bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm flex items-start hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                  <div className="mr-3 mt-0.5 h-4 w-4 rounded border border-slate-300 dark:border-slate-600 flex-shrink-0"></div>
                  <p className="flex-1 text-slate-700 dark:text-slate-300">{task}</p>
                   <button onClick={() => handleCopyToClipboard(task, t('aiPanel.plan.task'))} className="ml-2 p-1 rounded-md text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all active:scale-90"><Copy className="h-3.5 w-3.5"/></button>
                </div>
              )}
               <button onClick={handleAppendChecklist} className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"><Plus className="h-3.5 w-3.5" /> {t('aiPanel.actions.appendChecklist')}</button>
            </div>
          )}
        </div>
      </AgentSection>

      {/* Translator Agent */}
      <AgentSection
        title={t('aiPanel.translate.title')}
        icon={<Languages className="h-4 w-4 text-blue-500" />}
        onRun={() => runAgent('translate', handleTranslate)}
        isLoading={loadingAgent === 'translate'}
        buttonText={t('aiPanel.translate.button')}
        isCollapsed={!!collapsedSections['translate']}
        onToggleCollapse={() => toggleSection('translate')}
        disabled={!isApiKeySet}
        settingsPopover={
            <AgentSettingsPopover disabled={loadingAgent === 'translate' || !isApiKeySet}>
                <div className="text-xs p-2 w-48">
                    <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">{t('aiPanel.translate.settings.targetLanguage')}</label>
                     <select value={targetLanguage} onChange={e => setConfig('targetLanguage', e.target.value as AiAgentSettings['targetLanguage'])} className="w-full p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 text-xs">
                        {AVAILABLE_LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{t(lang.labelKey)}</option>)}
                    </select>
                </div>
            </AgentSettingsPopover>
        }
      >
        <div role="status" aria-live="polite">
          {loadingAgent === 'translate' && <LoadingPlaceholder text={t('aiPanel.translate.loading')} />}
          {translation && (
            <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative group">
                <div className="text-sm bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-60 overflow-y-auto text-slate-700 dark:text-slate-300 leading-relaxed">
                    <MarkdownResult content={translation.translatedText} />
                </div>
                <button onClick={() => handleCopyToClipboard(translation.translatedText, t('aiPanel.translate.translation'))} className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm active:scale-90"><Copy className="h-3.5 w-3.5"/></button>
              </div>
              <button onClick={() => handleReplaceContent(translation.translatedText)} className="mt-2 w-full py-2 text-xs font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"><Replace className="h-3.5 w-3.5"/> {t('aiPanel.actions.replace')}</button>
            </div>
          )}
        </div>
      </AgentSection>
      
       {/* Formatter Agent */}
      <AgentSection
        title={t('aiPanel.format.title')}
        icon={<Wand2 className="h-4 w-4 text-indigo-500" />}
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
            <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative group">
                <div className="text-sm bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-60 overflow-y-auto whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300 text-xs">
                    {formatted.formattedText}
                </div>
                 <button onClick={() => handleCopyToClipboard(formatted.formattedText, t('aiPanel.format.formattedText'))} className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-sm active:scale-90"><Copy className="h-3.5 w-3.5"/></button>
              </div>
               <button onClick={() => handleReplaceContent(formatted.formattedText)} className="mt-2 w-full py-2 text-xs font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"><Replace className="h-3.5 w-3.5"/> {t('aiPanel.actions.replace')}</button>
            </div>
          )}
        </div>
      </AgentSection>


      {/* Research Agent */}
      <AgentSection
        title={t('aiPanel.research.title')}
        icon={<Search className="h-4 w-4 text-teal-500" />}
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
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {research.answer && <div className="text-sm bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-300 leading-relaxed"><MarkdownResult content={research.answer} /></div>}
             {research.sources.length > 0 && (
                 <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">{t('aiPanel.research.sources')}</h4>
                    {research.sources.map((item, i) => (
                    <a href={item.uri} target="_blank" rel="noopener noreferrer" key={i} className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 border border-transparent hover:border-blue-100 dark:hover:border-slate-700 transition-colors group">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1"><Search className="h-3 w-3 opacity-50"/> {item.uri}</p>
                    </a>
                    ))}
                 </div>
             )}
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
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
                aria-label={t('aiPanel.settings')}
            >
                <Settings className="h-4 w-4" />
            </button>
            {isOpen && (
                <div className="absolute z-20 top-full right-0 mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
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
        className="flex flex-col items-center justify-center gap-2 p-3 text-center text-xs font-semibold bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 h-24"
    >
        <div className={`p-2 rounded-full bg-slate-50 dark:bg-slate-900 ${isLoading ? '' : 'text-slate-600 dark:text-slate-300'}`}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary-500" /> : <div className="h-5 w-5">{icon}</div>}
        </div>
        <span className="text-slate-700 dark:text-slate-200 leading-tight">{text}</span>
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
    <div className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl transition-all duration-300 ${isCollapsed ? 'hover:border-slate-300 dark:hover:border-slate-700' : 'shadow-md ring-1 ring-slate-900/5 dark:ring-slate-100/5'}`}>
        <button onClick={onToggleCollapse} className="w-full flex justify-between items-center p-3 cursor-pointer select-none" aria-expanded={!isCollapsed}>
            <h3 className="text-sm font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-200">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">{icon}</div> {title}
            </h3>
            <div className="flex items-center gap-2">
                {settingsPopover}
                 {!hideRunButton && onRun && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRun(); }}
                        disabled={isLoading || disabled}
                        aria-busy={isLoading}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                        {isLoading ? t('working') : buttonText}
                </button>
                )}
                <ChevronLeft className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isCollapsed ? 'rotate-0' : '-rotate-90'}`} />
            </div>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
            <div className="overflow-hidden">
                <div className="p-3 pt-0 border-t border-transparent">
                    {children}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AiAgentPanel;
