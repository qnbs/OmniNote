
import React, { useState, useCallback, useRef, useEffect, useMemo, createContext, useContext } from 'react';
import { Note } from '../core/types/note';
import { AiAgentData, AiAgentSettings, AgentMeta, AgentFeedback } from '../core/types/ai';
import * as geminiService from '../services/geminiService';
import { BrainCircuit, Lightbulb, Loader2, AlertTriangle, Plus, Copy, Settings, Image, Sparkles, Megaphone, ChevronLeft, MessageSquare, Send, Trash2, Activity, Target, Clock, User, ThumbsUp, ThumbsDown } from './icons';
import { useAppDispatch, useAppSelector } from '../core/store/hooks';
import { runAiAgent, streamChat, clearChat, addChatMessage, resetAiState, setAgentFeedback, saveToCache } from '../features/ai/aiSlice';
import { setAiSetting } from '../features/settings/settingsSlice';
import { addToast } from '../features/ui/uiSlice';
import { updateNote } from '../features/notes/noteSlice';
import { useLocale } from '../contexts/LocaleContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import ErrorBoundary from './ErrorBoundary';

// --- Configuration Constants ---
const IDEA_COUNTS: AiAgentSettings['ideaCount'][] = [3, 5, 7];
const IMAGE_STYLES: { value: AiAgentSettings['imageStyle'], labelKey: string }[] = [
    { value: 'default', labelKey: 'aiPanel.image.styles.default' },
    { value: 'photorealistic', labelKey: 'aiPanel.image.styles.photorealistic' },
    { value: 'watercolor', labelKey: 'aiPanel.image.styles.watercolor' },
    { value: 'anime', labelKey: 'aiPanel.image.styles.anime' },
    { value: 'cyberpunk', labelKey: 'aiPanel.image.styles.cyberpunk' },
];
const IMAGE_ASPECT_RATIOS: AiAgentSettings['imageAspectRatio'][] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const aspectRatioStyles: Record<AiAgentSettings['imageAspectRatio'], string> = {
    '16:9': 'aspect-[16/9]', '9:16': 'aspect-[9/16]', '1:1': 'aspect-square', '4:3': 'aspect-[4/3]', '3:4': 'aspect-[3/4]',
};

// --- Helper Components ---
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

const ThinkingIndicator = () => {
    const { t } = useLocale();
    const [phraseIndex, setPhraseIndex] = useState(0);
    
    const phrases = useMemo(() => [
        t('aiPanel.thinking.phase1'),
        t('aiPanel.thinking.phase2'),
        t('aiPanel.thinking.phase3'),
        t('aiPanel.thinking.phase4'),
        t('aiPanel.thinking.phase5')
    ], [t]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPhraseIndex(prev => (prev + 1) % phrases.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [phrases.length]);

    return (
        <div className="flex items-center gap-3 text-xs font-medium text-purple-600 dark:text-purple-400 animate-pulse bg-purple-50 dark:bg-purple-900/20 px-4 py-3 rounded-lg border border-purple-100 dark:border-purple-800">
            <Activity className="h-4 w-4 animate-bounce" />
            <span className="min-w-[140px]">{phrases[phraseIndex]}</span>
        </div>
    );
};

const FeedbackButtons: React.FC<{ agentName: string, current: AgentFeedback, latency: number | null }> = ({ agentName, current, latency }) => {
    const dispatch = useAppDispatch();
    const handleFeedback = (val: AgentFeedback) => {
        dispatch(setAgentFeedback({ agentName, feedback: val === current ? null : val }));
    };

    return (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
             {latency && (
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {(latency / 1000).toFixed(2)}s
                </span>
            )}
            <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => handleFeedback('positive')} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${current === 'positive' ? 'text-green-500' : 'text-slate-400'}`}>
                    <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleFeedback('negative')} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${current === 'negative' ? 'text-red-500' : 'text-slate-400'}`}>
                    <ThumbsDown className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}

// --- Logic Hook ---
const useAiAgentPanel = (activeNote: Note | null) => {
    const dispatch = useAppDispatch();
    const { t, locale } = useLocale();
    
    const aiState = useAppSelector(state => state.ai);
    const settings = useAppSelector(state => state.settings);
    const localConfig = settings.aiAgentDefaults;
    
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const isApiKeySet = !!process.env.API_KEY;
    const previousNoteIdRef = useRef<string | null>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [aiState.chatMessages, aiState.meta['chat'].status]);

    // Handle caching and state reset on note switch
    useEffect(() => {
        if (activeNote?.id && activeNote.id !== previousNoteIdRef.current) {
            // Save current state to cache if we are switching FROM a note
            if (previousNoteIdRef.current) {
                dispatch(saveToCache({ noteId: previousNoteIdRef.current }));
            }
            // Initialize/Restore state for new note
            dispatch(resetAiState({ noteId: activeNote.id }));
            previousNoteIdRef.current = activeNote.id;
        }
    }, [activeNote?.id, dispatch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previousNoteIdRef.current) {
                dispatch(saveToCache({ noteId: previousNoteIdRef.current }));
            }
        };
    }, [dispatch]);

    const toggleSection = useCallback((section: string) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);
    
    const setConfig = useCallback(<K extends keyof AiAgentSettings>(key: K, value: AiAgentSettings[K]) => {
        dispatch(setAiSetting({ key, value }));
    }, [dispatch]);

    const runAgentAction = useCallback((agentName: string, agentFunction: () => Promise<AiAgentData>, usesThinking: boolean = false) => {
        if (!activeNote || !activeNote.content) {
            dispatch(addToast({ message: t('toast.noteHasNoContent'), type: 'error' }));
            return;
        }
        dispatch(runAiAgent({ agentName, task: agentFunction, isThinking: usesThinking }));
    }, [activeNote, dispatch, t]);

    // Specific Handlers
    const handleAnalysis = useCallback(async () => {
        return await geminiService.getAnalysis(activeNote!.content, { depth: localConfig.analysisDepth }, locale);
    }, [activeNote, localConfig.analysisDepth, locale]);

    const handleBrainstorm = useCallback(async () => {
        return await geminiService.getBrainstormingIdeas(activeNote!.content, { count: localConfig.ideaCount, level: localConfig.creativityLevel }, locale);
    }, [activeNote, localConfig.ideaCount, localConfig.creativityLevel, locale]);

    const handlePlan = useCallback(async () => {
        return await geminiService.getStrategicPlan(activeNote!.content, { detail: localConfig.planDetail }, locale);
    }, [activeNote, localConfig.planDetail, locale]);

    const handleGenerateImage = useCallback(async () => {
        return await geminiService.generateImageFromNote(activeNote!.title, activeNote!.content, localConfig.imageStyle, localConfig.imageAspectRatio, localConfig.imageQuality);
    }, [activeNote, localConfig.imageStyle, localConfig.imageAspectRatio, localConfig.imageQuality]);
    
    const handleRunRecipe = useCallback(async (recipeName: 'blog' | 'meeting' | 'social') => {
        if (recipeName === 'blog') return await geminiService.runBlogPostRecipe(activeNote!.title, activeNote!.content, locale);
        if (recipeName === 'meeting') return await geminiService.runMeetingAnalysisRecipe(activeNote!.content, locale);
        return await geminiService.runSocialPostRecipe(activeNote!.content, locale);
    }, [activeNote, locale]);

    const handleChatSubmit = useCallback(async () => {
        if (!activeNote || !chatInput.trim() || aiState.meta['chat'].status === 'loading') return;
        const message = chatInput.trim();
        setChatInput('');
        dispatch(addChatMessage({ id: Date.now().toString(), role: 'user', text: message, timestamp: Date.now() }));
        dispatch(streamChat({
            noteContent: activeNote.content,
            history: aiState.chatMessages,
            message,
            persona: localConfig.chatPersona,
            locale
        }));
    }, [activeNote, chatInput, aiState.meta, aiState.chatMessages, localConfig.chatPersona, locale, dispatch]);

    const handleApplyTags = useCallback((newTags: string[]) => {
        if(!activeNote) return;
        const updatedTags = [...new Set([...activeNote.tags, ...newTags])];
        dispatch(updateNote({ ...activeNote, tags: updatedTags }));
        dispatch(addToast({ message: t('toast.tagsApplied'), type: 'success' }));
    }, [activeNote, dispatch, t]);

    const handleAppendPlan = useCallback(() => {
        if(!activeNote || !aiState.plan) return;
        const planMd = aiState.plan.tasks.map(t => `- [ ] **${t.title}** (${t.priority}) ${t.estimatedTime ? `- ${t.estimatedTime}` : ''}\n${t.subtasks?.map(s => `  - ${s}`).join('\n')}`).join('\n');
        dispatch(updateNote({...activeNote, content: activeNote.content + "\n\n## Action Plan\n" + planMd}));
        dispatch(addToast({ message: t('toast.checklistAppended'), type: 'success' }));
    }, [activeNote, aiState.plan, dispatch, t]);

    const handlePrependSummary = useCallback(() => {
        if(!activeNote || !aiState.analysis) return;
        dispatch(updateNote({...activeNote, content: `> **AI Summary**: ${aiState.analysis.summary}\n\n---\n\n` + activeNote.content}));
        dispatch(addToast({ message: t('toast.summaryPrepended'), type: 'success' }));
    }, [activeNote, aiState.analysis, dispatch, t]);

    const handleAppendImage = useCallback(() => {
        if(activeNote && aiState.image) {
            dispatch(updateNote({...activeNote, content: activeNote.content + `\n\n![AI Image](data:image/png;base64,${aiState.image.imageBytes})\n`})); 
            dispatch(addToast({ message: t('toast.imageAppended'), type: 'success' })); 
        }
    }, [activeNote, aiState.image, dispatch, t]);

    const handleApplyRecipe = useCallback(() => {
        if(activeNote && aiState.recipeResult) { 
            dispatch(updateNote({...activeNote, title: aiState.recipeResult.title, content: aiState.recipeResult.content})); 
            dispatch(addToast({ message: t('toast.recipeResultApplied'), type: 'success' })); 
        }
    }, [activeNote, aiState.recipeResult, dispatch, t]);

    return {
        activeNote,
        aiState,
        settings,
        localConfig,
        collapsedSections,
        chatInput,
        chatEndRef,
        isApiKeySet,
        // Actions
        toggleSection,
        setConfig,
        setChatInput,
        handleChatSubmit,
        clearChat: () => dispatch(clearChat()),
        runAnalysis: () => runAgentAction('analysis', handleAnalysis, localConfig.analysisDepth === 'deep'),
        runBrainstorm: () => runAgentAction('brainstorm', handleBrainstorm),
        runPlan: () => runAgentAction('plan', handlePlan, localConfig.planDetail === 'strategic'),
        runImage: () => runAgentAction('image', handleGenerateImage),
        runRecipe: (type: 'blog'|'meeting'|'social') => runAgentAction(`recipe-${type}`, () => handleRunRecipe(type)),
        // Result Handlers
        handleApplyTags,
        handleAppendPlan,
        handlePrependSummary,
        handleAppendImage,
        handleApplyRecipe
    };
};

// --- Context ---
type AiContextType = ReturnType<typeof useAiAgentPanel>;
const AiContext = createContext<AiContextType | null>(null);

const useAiContext = () => {
    const ctx = useContext(AiContext);
    if(!ctx) throw new Error("useAiContext must be used within AiAgentPanel");
    return ctx;
};

// --- Sub-Components ---

const ChatAgent = () => {
    const { t } = useLocale();
    const { aiState, localConfig, collapsedSections, toggleSection, isApiKeySet, setConfig, chatInput, setChatInput, handleChatSubmit, clearChat, chatEndRef } = useAiContext();
    const meta = aiState.meta['chat'];

    return (
        <AgentSection
            title={t('aiPanel.chat.title')}
            icon={<MessageSquare className="h-4 w-4 text-indigo-500" />}
            hideRunButton={true}
            isCollapsed={!!collapsedSections['chat']}
            onToggleCollapse={() => toggleSection('chat')}
            disabled={!isApiKeySet}
            meta={meta}
            settingsPopover={
                <AgentSettingsPopover disabled={!isApiKeySet}>
                    <div className="p-2 w-48">
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">{t('aiPanel.settings.persona')}</label>
                        <select value={localConfig.chatPersona} onChange={(e) => setConfig('chatPersona', e.target.value as AiAgentSettings['chatPersona'])} className="w-full p-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded border-none">
                            <option value="helpful">{t('aiPanel.chat.personas.helpful')}</option>
                            <option value="socratic">{t('aiPanel.chat.personas.socratic')}</option>
                            <option value="critic">{t('aiPanel.chat.personas.critic')}</option>
                            <option value="coder">{t('aiPanel.chat.personas.coder')}</option>
                        </select>
                    </div>
                </AgentSettingsPopover>
            }
        >
            <ErrorBoundary sectionName="Chat Agent">
            <div className="flex flex-col h-[350px]">
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 mb-2 scroll-smooth">
                    {aiState.chatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2 opacity-50">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><MessageSquare className="h-6 w-6" /></div>
                            <p className="text-xs">{t('aiPanel.chat.emptyState')}</p>
                        </div>
                    )}
                    {aiState.chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'}`}>
                                {msg.role === 'model' && !msg.text && meta.status === 'loading' ? (
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
                    <button onClick={clearChat} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" disabled={aiState.chatMessages.length === 0}><Trash2 className="h-4 w-4" /></button>
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                            placeholder={t('aiPanel.chat.inputPlaceholder')}
                            disabled={meta.status === 'loading' || !isApiKeySet}
                            className="w-full pl-4 pr-10 py-2 text-sm rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                        />
                        <button onClick={handleChatSubmit} disabled={!chatInput.trim() || meta.status === 'loading'} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-90"><Send className="h-3 w-3" /></button>
                    </div>
                </div>
            </div>
            </ErrorBoundary>
        </AgentSection>
    );
};

const AnalysisAgent = () => {
    const { t } = useLocale();
    const { aiState, runAnalysis, handleApplyTags, handlePrependSummary, localConfig, setConfig, collapsedSections, toggleSection, isApiKeySet } = useAiContext();
    const meta = aiState.meta['analysis'];

    return (
        <AgentSection
            title={t('aiPanel.analysis.title')}
            icon={<BrainCircuit className="h-4 w-4 text-purple-500" />}
            onRun={runAnalysis}
            meta={meta}
            buttonText={t('aiPanel.analysis.button')}
            isCollapsed={!!collapsedSections['analysis']}
            onToggleCollapse={() => toggleSection('analysis')}
            disabled={!isApiKeySet}
            settingsPopover={
                <AgentSettingsPopover disabled={meta.status === 'loading' || !isApiKeySet}>
                    <div className="text-xs p-2 w-48">
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">{t('aiPanel.settings.depth')}</label>
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setConfig('analysisDepth', 'standard')} className={`flex-1 py-1 rounded-md transition-all ${localConfig.analysisDepth === 'standard' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t('aiPanel.settings.standard')}</button>
                            <button onClick={() => setConfig('analysisDepth', 'deep')} className={`flex-1 py-1 rounded-md transition-all ${localConfig.analysisDepth === 'deep' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t('aiPanel.settings.deep')}</button>
                        </div>
                    </div>
                </AgentSettingsPopover>
            }
        >
            <ErrorBoundary sectionName="Analysis Agent">
            <div role="status" aria-live="polite" className="space-y-3">
            {aiState.isThinking && meta.status === 'loading' && <ThinkingIndicator />}
            {aiState.analysis && meta.status === 'succeeded' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                {/* Metrics Row */}
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${aiState.analysis.sentiment === 'positive' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : aiState.analysis.sentiment === 'negative' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {aiState.analysis.sentiment}
                    </span>
                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        Complexity: {aiState.analysis.complexityScore}/10
                    </span>
                </div>
                
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm leading-relaxed">
                    <MarkdownResult content={aiState.analysis.summary} />
                </div>

                {aiState.analysis.keyEntities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {aiState.analysis.keyEntities.map((e, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                {e.category === 'person' && <User className="h-3 w-3"/>}
                                {e.name}
                            </span>
                        ))}
                    </div>
                )}

                {aiState.analysis.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {aiState.analysis.tags.map(tag => <span key={tag} className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs px-2 py-1 rounded-md border border-primary-100 dark:border-primary-800">#{tag}</span>)}
                        <button onClick={() => handleApplyTags(aiState.analysis!.tags)} className="text-xs text-primary-600 hover:underline font-medium">{t('aiPanel.actions.addTags')}</button>
                    </div>
                )}
                <button onClick={handlePrependSummary} className="w-full py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">{t('aiPanel.actions.prepend')}</button>
                <FeedbackButtons agentName="analysis" current={meta.feedback} latency={meta.latency} />
                </div>
            )}
            </div>
            </ErrorBoundary>
        </AgentSection>
    );
};

const PlanAgent = () => {
    const { t } = useLocale();
    const { aiState, runPlan, handleAppendPlan, localConfig, setConfig, collapsedSections, toggleSection, isApiKeySet } = useAiContext();
    const meta = aiState.meta['plan'];

    return (
        <AgentSection
            title={t('aiPanel.plan.title')}
            icon={<Target className="h-4 w-4 text-emerald-500" />}
            onRun={runPlan}
            meta={meta}
            buttonText={t('aiPanel.plan.button')}
            isCollapsed={!!collapsedSections['plan']}
            onToggleCollapse={() => toggleSection('plan')}
            disabled={!isApiKeySet}
            settingsPopover={
                <AgentSettingsPopover disabled={meta.status === 'loading' || !isApiKeySet}>
                    <div className="text-xs p-2 w-48">
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">{t('aiPanel.settings.detailLevel')}</label>
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setConfig('planDetail', 'simple')} className={`flex-1 py-1 rounded-md transition-all ${localConfig.planDetail === 'simple' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t('aiPanel.settings.simple')}</button>
                            <button onClick={() => setConfig('planDetail', 'strategic')} className={`flex-1 py-1 rounded-md transition-all ${localConfig.planDetail === 'strategic' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t('aiPanel.settings.strategic')}</button>
                        </div>
                    </div>
                </AgentSettingsPopover>
            }
        >
            <ErrorBoundary sectionName="Plan Agent">
            <div role="status" aria-live="polite" className="space-y-3">
            {aiState.isThinking && meta.status === 'loading' && <ThinkingIndicator />}
            {aiState.plan && meta.status === 'succeeded' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-medium">
                        <Target className="inline h-4 w-4 mr-2"/> {aiState.plan.goal}
                    </div>
                    <div className="space-y-2">
                        {aiState.plan.tasks.map((task, i) => (
                            <div key={i} className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{task.title}</span>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {task.priority}
                                    </span>
                                </div>
                                {task.estimatedTime && <div className="text-xs text-slate-400 flex items-center gap-1 mb-2"><Clock className="h-3 w-3"/> {task.estimatedTime}</div>}
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <ul className="pl-4 list-disc text-xs text-slate-600 dark:text-slate-400 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-1">
                                        {task.subtasks.map((sub, j) => <li key={j}>{sub}</li>)}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAppendPlan} className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">{t('aiPanel.actions.appendChecklist')}</button>
                    <FeedbackButtons agentName="plan" current={meta.feedback} latency={meta.latency} />
                </div>
            )}
            </div>
            </ErrorBoundary>
        </AgentSection>
    );
};

const CreativeAgent = () => {
    const { t } = useLocale();
    const { aiState, runBrainstorm, localConfig, setConfig, collapsedSections, toggleSection, isApiKeySet } = useAiContext();
    const meta = aiState.meta['brainstorm'];

    return (
        <AgentSection
            title={t('aiPanel.creative.title')}
            icon={<Lightbulb className="h-4 w-4 text-amber-500" />}
            onRun={runBrainstorm}
            meta={meta}
            buttonText={t('aiPanel.creative.button')}
            isCollapsed={!!collapsedSections['creative']}
            onToggleCollapse={() => toggleSection('creative')}
            disabled={!isApiKeySet}
            settingsPopover={
                <AgentSettingsPopover disabled={meta.status === 'loading' || !isApiKeySet}>
                    <div className="text-xs p-2 w-48 space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t('aiPanel.settings.temperature')}</label>
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                {['conservative', 'balanced', 'wild'].map((level) => (
                                    <button key={level} onClick={() => setConfig('creativityLevel', level as AiAgentSettings['creativityLevel'])} className={`flex-1 py-1 rounded-md transition-all capitalize ${localConfig.creativityLevel === level ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>{t(`aiPanel.settings.creativeLevels.${level}`)}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t('aiPanel.creative.settings.ideaCount')}</label>
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                {IDEA_COUNTS.map(num => (
                                    <button key={num} onClick={() => setConfig('ideaCount', num)} className={`flex-1 py-1 rounded-md transition-all ${localConfig.ideaCount === num ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>{num}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </AgentSettingsPopover>
            }
        >
            <ErrorBoundary sectionName="Creative Agent">
            <div role="status" aria-live="polite" className="space-y-3">
            {aiState.ideas && meta.status === 'succeeded' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-2">
                {aiState.ideas.map((idea, i) => 
                    <div key={i} className="group relative text-sm bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm flex items-start hover:border-amber-200 dark:hover:border-amber-900 transition-colors">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="flex-1 text-slate-700 dark:text-slate-300">{idea}</p>
                    <button onClick={() => navigator.clipboard.writeText(idea)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"><Copy className="h-3 w-3"/></button>
                    </div>
                )}
                <FeedbackButtons agentName="brainstorm" current={meta.feedback} latency={meta.latency} />
                </div>
            )}
            </div>
            </ErrorBoundary>
        </AgentSection>
    );
};

const ImageAgent = () => {
    const { t } = useLocale();
    const { aiState, runImage, handleAppendImage, localConfig, setConfig, collapsedSections, toggleSection, isApiKeySet } = useAiContext();
    const meta = aiState.meta['image'];

    return (
        <AgentSection
            title={t('aiPanel.image.title')}
            icon={<Image className="h-4 w-4 text-pink-500" />}
            onRun={runImage}
            meta={meta}
            buttonText={t('aiPanel.image.button')}
            isCollapsed={!!collapsedSections['image']}
            onToggleCollapse={() => toggleSection('image')}
            disabled={!isApiKeySet}
            settingsPopover={
                <AgentSettingsPopover disabled={meta.status === 'loading' || !isApiKeySet}>
                    <div className="text-xs p-2 w-56 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-500 uppercase">{t('aiPanel.settings.hdQuality')}</label>
                            <input type="checkbox" checked={localConfig.imageQuality === 'hd'} onChange={(e) => setConfig('imageQuality', e.target.checked ? 'hd' : 'standard')} className="rounded text-pink-500 focus:ring-pink-500 border-slate-300" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t('aiPanel.image.settings.style')}</label>
                            <select value={localConfig.imageStyle} onChange={e => setConfig('imageStyle', e.target.value as AiAgentSettings['imageStyle'])} className="w-full p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border-none text-xs">
                                {IMAGE_STYLES.map(style => <option key={style.value} value={style.value}>{t(style.labelKey)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t('aiPanel.image.settings.aspectRatio')}</label>
                            <div className="grid grid-cols-3 gap-1">
                                {IMAGE_ASPECT_RATIOS.map(ratio => (
                                    <button key={ratio} onClick={() => setConfig('imageAspectRatio', ratio)} className={`px-2 py-1 rounded-md text-[10px] border transition-all ${localConfig.imageAspectRatio === ratio ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{ratio}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </AgentSettingsPopover>
            }
        >
            <ErrorBoundary sectionName="Image Agent">
            <div role="status" aria-live="polite">
                {meta.status === 'loading' && (
                    <div className={`mt-2 w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 animate-pulse flex flex-col items-center justify-center text-slate-500 ${aspectRatioStyles[localConfig.imageAspectRatio]}`}>
                        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                        <p className="mt-2 text-xs font-medium">{t('aiPanel.image.generating')}</p>
                    </div>
                )}
                {aiState.image && meta.status === 'succeeded' && (
                    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className={`rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 relative group ${aspectRatioStyles[localConfig.imageAspectRatio]}`}>
                        <img src={`data:image/png;base64,${aiState.image.imageBytes}`} alt="Generated" className="w-full h-full object-cover" />
                        <button onClick={handleAppendImage} className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all transform active:scale-90"><Plus className="h-4 w-4"/></button>
                    </div>
                    <FeedbackButtons agentName="image" current={meta.feedback} latency={meta.latency} />
                    </div>
                )}
            </div>
            </ErrorBoundary>
        </AgentSection>
    );
};

const RecipesAgent = () => {
    const { t } = useLocale();
    const { aiState, runRecipe, handleApplyRecipe, collapsedSections, toggleSection, isApiKeySet } = useAiContext();
    
    // Determine which recipe is loading
    const recipeStatus = {
        blog: aiState.meta['recipe-blog'].status === 'loading',
        meeting: aiState.meta['recipe-meeting'].status === 'loading',
        social: aiState.meta['recipe-social'].status === 'loading',
    };

    // Helper to get active recipe meta
    const activeRecipeKey = aiState.recipeResult ? (
        aiState.meta['recipe-blog'].lastRunAt ? 'recipe-blog' : 
        aiState.meta['recipe-meeting'].lastRunAt ? 'recipe-meeting' : 'recipe-social'
    ) : null;

    const meta = activeRecipeKey ? aiState.meta[activeRecipeKey] : { feedback: null, latency: null, status: 'idle' };

    return (
        <AgentSection
            title={t('aiPanel.recipes.title')}
            icon={<Sparkles className="h-4 w-4 text-amber-500" />}
            hideRunButton={true}
            isCollapsed={!!collapsedSections['recipes']}
            onToggleCollapse={() => toggleSection('recipes')}
        >
            <ErrorBoundary sectionName="Recipes Agent">
            <div className="grid grid-cols-3 gap-2 mt-2">
                <RecipeButton icon={<Megaphone/>} text={t('aiPanel.recipes.blog.button')} onClick={() => runRecipe('blog')} isLoading={recipeStatus.blog} disabled={!isApiKeySet} />
                <RecipeButton icon={<Megaphone/>} text={t('aiPanel.recipes.meeting.button')} onClick={() => runRecipe('meeting')} isLoading={recipeStatus.meeting} disabled={!isApiKeySet}/>
                <RecipeButton icon={<Megaphone/>} text={t('aiPanel.recipes.social.button')} onClick={() => runRecipe('social')} isLoading={recipeStatus.social} disabled={!isApiKeySet}/>
            </div>
            {aiState.recipeResult && !Object.values(recipeStatus).some(Boolean) && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="font-bold text-sm mb-2">{aiState.recipeResult.title}</h4>
                    <div className="max-h-40 overflow-y-auto text-xs text-slate-600 dark:text-slate-400"><MarkdownResult content={aiState.recipeResult.content} /></div>
                    <button onClick={handleApplyRecipe} className="w-full mt-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">{t('aiPanel.actions.replaceNote')}</button>
                    {activeRecipeKey && <FeedbackButtons agentName={activeRecipeKey} current={meta.feedback as AgentFeedback} latency={meta.latency as number} />}
                </div>
            )}
            </ErrorBoundary>
        </AgentSection>
    );
};

// --- Main Component ---

const AiAgentPanel: React.FC<{ activeNote: Note | null }> = ({ activeNote }) => {
  const { t } = useLocale();
  const logic = useAiAgentPanel(activeNote);
  
  if (!activeNote) return <div className="p-8 text-center text-slate-400 text-sm">{t('aiPanel.selectNote')}</div>;

  // Helper to check if any agent has error
  const activeError = Object.values(logic.aiState.meta).find(m => m.status === 'failed')?.error;

  return (
    <AiContext.Provider value={logic}>
        <div className="p-3 space-y-4 pb-20">
            {activeError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p>{activeError}</p>
                </div>
            )}

            {!logic.isApiKeySet && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p>{t('aiPanel.apiKeyMissing')}</p>
                </div>
            )}

            <ChatAgent />
            <AnalysisAgent />
            <PlanAgent />
            <CreativeAgent />
            <ImageAgent />
            <RecipesAgent />
        </div>
    </AiContext.Provider>
  );
};

// --- Helper UI Components ---
interface AgentSettingsPopoverProps { children: React.ReactNode; disabled?: boolean; }
const AgentSettingsPopover: React.FC<AgentSettingsPopoverProps> = ({ children, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => { if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);
    
    return (
        <div className="relative inline-block" ref={popoverRef}>
            <button onClick={(e) => { e.stopPropagation(); if(!disabled) setIsOpen(!isOpen); }} disabled={disabled} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 transition-colors active:scale-95"><Settings className="h-4 w-4" /></button>
            {isOpen && <div className="absolute z-20 top-full right-0 mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">{children}</div>}
        </div>
    );
};

const RecipeButton: React.FC<{icon: React.ReactNode, text: string, onClick: () => void, isLoading: boolean, disabled?: boolean}> = ({icon, text, onClick, isLoading, disabled}) => (
    <button onClick={onClick} disabled={isLoading || disabled} className="flex flex-col items-center justify-center gap-2 p-3 text-center text-xs font-semibold bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-24 group">
        <div className={`p-2 rounded-full bg-slate-50 dark:bg-slate-900 transition-colors group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 ${isLoading ? '' : 'text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400'}`}>{isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary-500" /> : React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5" })}</div>
        <span className="leading-tight scale-90">{text}</span>
    </button>
);

interface AgentSectionProps { title: string; icon: React.ReactNode; onRun?: () => void; meta?: AgentMeta; buttonText?: string; children: React.ReactNode; hideRunButton?: boolean; isCollapsed: boolean; onToggleCollapse: () => void; disabled?: boolean; settingsPopover?: React.ReactNode; }
const AgentSection: React.FC<AgentSectionProps> = ({ title, icon, onRun, meta, buttonText, children, hideRunButton=false, isCollapsed, onToggleCollapse, disabled, settingsPopover }) => {
    const isLoading = meta?.status === 'loading';
    
    return (
        <div className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl transition-all duration-300 ${isCollapsed ? 'hover:border-slate-300 dark:hover:border-slate-700' : 'shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-100/5'}`}>
            <button onClick={onToggleCollapse} className="w-full flex justify-between items-center p-3 cursor-pointer select-none">
                <h3 className="text-sm font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-200"><div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">{icon}</div> {title}</h3>
                <div className="flex items-center gap-2">
                    {settingsPopover}
                    {!hideRunButton && onRun && (
                        <button onClick={(e) => { e.stopPropagation(); onRun(); }} disabled={isLoading || disabled} className="px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm">
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin"/> : buttonText}
                    </button>
                    )}
                    <ChevronLeft className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isCollapsed ? 'rotate-0' : '-rotate-90'}`} />
                </div>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}><div className="overflow-hidden"><div className="p-3 pt-0 border-t border-transparent">{children}</div></div></div>
        </div>
    );
}

export default AiAgentPanel;
