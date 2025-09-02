

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { AppSettings, AiAgentSettings } from '../types';

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
        summaryLength: 'short',
        ideaCount: 3,
        planDetail: 'simple',
        targetLanguage: 'English',
        imageStyle: 'default',
        imageAspectRatio: '1:1',
    }
};

interface SettingsContextType {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setAiSetting: <K extends keyof AiAgentSettings>(key: K, value: AiAgentSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const storedSettings = localStorage.getItem('omninote_settings');
      if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          // Deep merge to ensure new default settings are applied if not present in storage
          return {
              ...defaultSettings,
              ...parsed,
              aiAgentDefaults: {
                  ...defaultSettings.aiAgentDefaults,
                  ...(parsed.aiAgentDefaults || {})
              }
          };
      }
      return defaultSettings;
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('omninote_settings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  const setSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const setAiSetting = useCallback(<K extends keyof AiAgentSettings>(key: K, value: AiAgentSettings[K]) => {
    setSettings(prev => ({
        ...prev,
        aiAgentDefaults: {
            ...prev.aiAgentDefaults,
            [key]: value
        }
    }))
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem('omninote_settings');
  }, []);

  const value = useMemo(() => ({ settings, setSetting, setAiSetting, resetSettings }), [settings, setSetting, setAiSetting, resetSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
