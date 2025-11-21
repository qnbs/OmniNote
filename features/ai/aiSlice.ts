
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AiAgentData, AdvancedAnalysisResult, BrainstormSuggestion, StrategicPlanResult, ResearchSuggestion, TranslateSuggestion, FormatSuggestion, ImageSuggestion, AiRecipeResult, ChatMessage, AgentMeta, AgentFeedback } from '../../core/types/ai';
import * as geminiService from '../../services/geminiService';

// Helper to create initial meta state
const createInitialMeta = (): AgentMeta => ({
    status: 'idle',
    error: null,
    latency: null,
    feedback: null,
    lastRunAt: null
});

interface AiState {
    // Meta data for each agent type
    meta: Record<string, AgentMeta>;
    
    // Data slots
    analysis: AdvancedAnalysisResult | null;
    ideas: string[] | null;
    plan: StrategicPlanResult | null;
    research: ResearchSuggestion | null;
    translation: TranslateSuggestion | null;
    formatted: FormatSuggestion | null;
    image: ImageSuggestion | null;
    recipeResult: AiRecipeResult | null;
    
    // Chat
    chatMessages: ChatMessage[];
    isThinking: boolean;
    
    // Cache (Key: noteId -> State Snapshot)
    cache: Record<string, Partial<AiState>>;
}

const initialState: AiState = {
    meta: {
        analysis: createInitialMeta(),
        brainstorm: createInitialMeta(),
        plan: createInitialMeta(),
        research: createInitialMeta(),
        translate: createInitialMeta(),
        format: createInitialMeta(),
        image: createInitialMeta(),
        'recipe-blog': createInitialMeta(),
        'recipe-meeting': createInitialMeta(),
        'recipe-social': createInitialMeta(),
        chat: createInitialMeta(),
    },
    analysis: null,
    ideas: null,
    plan: null,
    research: null,
    translation: null,
    formatted: null,
    image: null,
    recipeResult: null,
    chatMessages: [],
    isThinking: false,
    cache: {},
};

export const runAiAgent = createAsyncThunk(
    'ai/runAgent',
    async (payload: { 
        agentName: string; 
        task: () => Promise<AiAgentData>; 
        isThinking?: boolean 
    }, { rejectWithValue }) => {
        const startTime = Date.now();
        try {
            const result = await payload.task();
            const endTime = Date.now();
            return { 
                agentName: payload.agentName, 
                result, 
                latency: endTime - startTime 
            };
        } catch (error: any) {
            return rejectWithValue({ 
                agentName: payload.agentName, 
                error: error.message || 'AI Agent failed' 
            });
        }
    }
);

export const streamChat = createAsyncThunk(
    'ai/streamChat',
    async (payload: {
        noteContent: string;
        history: ChatMessage[];
        message: string;
        persona: string;
        locale: 'en' | 'de';
    }, { dispatch, rejectWithValue }) => {
        try {
            await geminiService.streamChatWithNote(
                payload.noteContent,
                payload.history,
                payload.message,
                payload.persona,
                (chunk) => {
                    dispatch(updateLastChatMessage(chunk));
                },
                payload.locale
            );
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        resetAiState: (state, action: PayloadAction<{ noteId?: string }>) => {
            // If we have a noteId, try to load from cache
            if (action.payload.noteId && state.cache[action.payload.noteId]) {
                const cached = state.cache[action.payload.noteId];
                // Merge cached state
                state.analysis = cached.analysis || null;
                state.ideas = cached.ideas || null;
                state.plan = cached.plan || null;
                state.image = cached.image || null;
                state.recipeResult = cached.recipeResult || null;
                state.meta = { ...initialState.meta, ...(cached.meta || {}) };
                state.chatMessages = cached.chatMessages || [];
                return;
            }

            // Otherwise reset to initial
            state.analysis = null;
            state.ideas = null;
            state.plan = null;
            state.research = null;
            state.translation = null;
            state.formatted = null;
            state.image = null;
            state.recipeResult = null;
            
            // Reset metas but keep keys
            Object.keys(state.meta).forEach(key => {
                state.meta[key] = createInitialMeta();
            });
            
            state.chatMessages = [];
            state.isThinking = false;
        },
        saveToCache: (state, action: PayloadAction<{ noteId: string }>) => {
            state.cache[action.payload.noteId] = {
                analysis: state.analysis,
                ideas: state.ideas,
                plan: state.plan,
                image: state.image,
                recipeResult: state.recipeResult,
                meta: state.meta,
                chatMessages: state.chatMessages
            };
        },
        clearChat: (state) => {
            state.chatMessages = [];
            state.meta['chat'] = createInitialMeta();
        },
        addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.chatMessages.push(action.payload);
        },
        updateLastChatMessage: (state, action: PayloadAction<string>) => {
            if (state.chatMessages.length > 0) {
                const lastMsg = state.chatMessages[state.chatMessages.length - 1];
                if (lastMsg.role === 'model') {
                    lastMsg.text += action.payload;
                }
            }
        },
        setAgentFeedback: (state, action: PayloadAction<{ agentName: string, feedback: AgentFeedback }>) => {
            if (state.meta[action.payload.agentName]) {
                state.meta[action.payload.agentName].feedback = action.payload.feedback;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(runAiAgent.pending, (state, action) => {
                const agentName = action.meta.arg.agentName;
                if (!state.meta[agentName]) state.meta[agentName] = createInitialMeta();
                state.meta[agentName].status = 'loading';
                state.meta[agentName].error = null;
                state.meta[agentName].latency = null;
                state.isThinking = !!action.meta.arg.isThinking;
            })
            .addCase(runAiAgent.fulfilled, (state, action) => {
                const { agentName, result, latency } = action.payload;
                state.meta[agentName].status = 'succeeded';
                state.meta[agentName].latency = latency;
                state.meta[agentName].lastRunAt = Date.now();
                state.isThinking = false;
                
                switch(agentName) {
                    case 'analysis': state.analysis = result as AdvancedAnalysisResult; break;
                    case 'brainstorm': state.ideas = (result as BrainstormSuggestion).ideas; break;
                    case 'plan': state.plan = result as StrategicPlanResult; break;
                    case 'research': state.research = result as ResearchSuggestion; break;
                    case 'translate': state.translation = result as TranslateSuggestion; break;
                    case 'format': state.formatted = result as FormatSuggestion; break;
                    case 'image': state.image = result as ImageSuggestion; break;
                    case 'recipe-blog':
                    case 'recipe-meeting':
                    case 'recipe-social':
                        state.recipeResult = result as AiRecipeResult; break;
                }
            })
            .addCase(runAiAgent.rejected, (state, action) => {
                const payload = action.payload as { agentName: string; error: string };
                const agentName = payload?.agentName || action.meta.arg.agentName;
                const errorMsg = payload?.error || action.error.message || 'Unknown error';
                
                if (!state.meta[agentName]) state.meta[agentName] = createInitialMeta();
                state.meta[agentName].status = 'failed';
                state.meta[agentName].error = errorMsg;
                state.isThinking = false;
            })
            .addCase(streamChat.pending, (state) => {
                state.meta['chat'].status = 'loading';
                state.meta['chat'].error = null;
                state.chatMessages.push({ 
                    id: Date.now().toString(), 
                    role: 'model', 
                    text: '', 
                    timestamp: Date.now() 
                });
            })
            .addCase(streamChat.fulfilled, (state) => {
                state.meta['chat'].status = 'succeeded';
            })
            .addCase(streamChat.rejected, (state, action) => {
                state.meta['chat'].status = 'failed';
                state.meta['chat'].error = action.payload as string;
            });
    }
});

export const { resetAiState, clearChat, addChatMessage, updateLastChatMessage, setAgentFeedback, saveToCache } = aiSlice.actions;
export default aiSlice.reducer;
