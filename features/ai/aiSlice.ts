
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AiAgentData, AdvancedAnalysisResult, BrainstormSuggestion, StrategicPlanResult, ResearchSuggestion, TranslateSuggestion, FormatSuggestion, ImageSuggestion, AiRecipeResult, ChatMessage } from '../../core/types/ai';
import * as geminiService from '../../services/geminiService';

interface AiState {
    loadingAgent: string | null;
    error: string | null;
    analysis: AdvancedAnalysisResult | null;
    ideas: string[] | null;
    plan: StrategicPlanResult | null;
    research: ResearchSuggestion | null;
    translation: TranslateSuggestion | null;
    formatted: FormatSuggestion | null;
    image: ImageSuggestion | null;
    recipeResult: AiRecipeResult | null;
    chatMessages: ChatMessage[];
    isThinking: boolean;
}

const initialState: AiState = {
    loadingAgent: null,
    error: null,
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
};

export const runAiAgent = createAsyncThunk(
    'ai/runAgent',
    async (payload: { 
        agentName: string; 
        task: () => Promise<AiAgentData>; 
        isThinking?: boolean 
    }, { rejectWithValue }) => {
        try {
            const result = await payload.task();
            return { agentName: payload.agentName, result };
        } catch (error: any) {
            return rejectWithValue(error.message || 'AI Agent failed');
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
        resetAiState: (state) => {
            state.analysis = null;
            state.ideas = null;
            state.plan = null;
            state.research = null;
            state.translation = null;
            state.formatted = null;
            state.image = null;
            state.recipeResult = null;
            state.error = null;
            state.loadingAgent = null;
        },
        clearChat: (state) => {
            state.chatMessages = [];
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
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(runAiAgent.pending, (state, action) => {
                state.loadingAgent = action.meta.arg.agentName;
                state.error = null;
                state.isThinking = !!action.meta.arg.isThinking;
            })
            .addCase(runAiAgent.fulfilled, (state, action) => {
                state.loadingAgent = null;
                state.isThinking = false;
                const { agentName, result } = action.payload;
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
                state.loadingAgent = null;
                state.isThinking = false;
                state.error = action.payload as string;
            })
            .addCase(streamChat.pending, (state) => {
                state.loadingAgent = 'chat';
                state.error = null;
                state.chatMessages.push({ role: 'model', text: '' });
            })
            .addCase(streamChat.fulfilled, (state) => {
                state.loadingAgent = null;
            })
            .addCase(streamChat.rejected, (state, action) => {
                state.loadingAgent = null;
                state.error = action.payload as string;
            });
    }
});

export const { resetAiState, clearChat, addChatMessage, updateLastChatMessage } = aiSlice.actions;
export default aiSlice.reducer;
