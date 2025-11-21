
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../../core/types/settings';
import { AiAgentSettings } from '../../core/types/ai';

const defaultSettings: AppSettings = {
    density: 'default',
    font: 'system-ui',
    reduceMotion: false,
    editorFontSize: 'medium',
    focusMode: false,
    autoSaveDelay: 1500,
    showWordCount: true,
    defaultEditorView: 'edit',
    aiAgentDefaults: {
        analysisDepth: 'standard',
        summaryLength: 'short',
        ideaCount: 3,
        creativityLevel: 'balanced',
        planDetail: 'simple',
        targetLanguage: 'English',
        imageStyle: 'default',
        imageAspectRatio: '1:1',
        imageQuality: 'standard',
        chatPersona: 'helpful'
    }
};

// Load initial state from localStorage synchronously
const loadInitialState = (): AppSettings => {
    try {
        const stored = localStorage.getItem('omninote_settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            
             let safeTargetLanguage = parsed.aiAgentDefaults?.targetLanguage;
             if (safeTargetLanguage !== 'English' && safeTargetLanguage !== 'German') {
                 safeTargetLanguage = defaultSettings.aiAgentDefaults.targetLanguage;
             }
            return {
                ...defaultSettings,
                ...parsed,
                aiAgentDefaults: {
                    ...defaultSettings.aiAgentDefaults,
                    ...(parsed.aiAgentDefaults || {}),
                    targetLanguage: safeTargetLanguage
                }
            };
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return defaultSettings;
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState: loadInitialState(),
    reducers: {
        setSetting: <K extends keyof AppSettings>(state: AppSettings, action: PayloadAction<{ key: K; value: AppSettings[K] }>) => {
            state[action.payload.key] = action.payload.value;
        },
        setAiSetting: <K extends keyof AiAgentSettings>(state: AppSettings, action: PayloadAction<{ key: K; value: AiAgentSettings[K] }>) => {
            state.aiAgentDefaults[action.payload.key] = action.payload.value;
        },
        resetSettings: () => {
            return defaultSettings;
        }
    }
});

export const { setSetting, setAiSetting, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
