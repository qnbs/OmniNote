
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
