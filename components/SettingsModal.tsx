

import React, { useState, useEffect, useRef } from 'react';
import { Note, Template, AppSettings, AiAgentSettings, AVAILABLE_LANGUAGES } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import { X, FileDown, FileUp, AlertTriangle, Palette, Pencil, BrainCircuit, Database } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'all' | 'notes' | 'templates' | 'settings') => void;
  onImport: (data: { notes?: Note[], templates?: Template[], settings?: AppSettings }) => void;
}

type Tab = 'appearance' | 'editor' | 'ai' | 'data';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onExport, onImport }) => {
  const { addToast } = useToast();
  const { settings, setSetting, resetSettings, setAiSetting } = useSettings();
  const { locale, setLocale, t } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [exportType, setExportType] = useState<'all' | 'notes' | 'templates' | 'settings'>('all');
  const [activeTab, setActiveTab] = useState<Tab>('appearance');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsEntering(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImportClick = () => {
    if (!file) {
      addToast(t('toast.selectFile'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error(t('toast.fileReadError'));
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') throw new Error(t('toast.invalidFileFormat'));

        // Pass all data to parent handler
        onImport(data);

        // Apply settings directly
        if (data.settings && typeof data.settings === 'object') {
            Object.keys(data.settings).forEach(key => {
                if (key !== 'aiAgentDefaults') {
                     setSetting(key as keyof AppSettings, data.settings[key as keyof AppSettings]);
                }
            });
            if (data.settings.aiAgentDefaults) {
                Object.keys(data.settings.aiAgentDefaults).forEach(key => {
                    setAiSetting(key as keyof AiAgentSettings, data.settings.aiAgentDefaults[key as keyof AiAgentSettings]);
                });
            }
        }
        
      } catch (error: any) {
        addToast(t('toast.importFailedDetails', { message: error.message }), 'error');
        console.error('Import error:', error);
      }
    };
    reader.onerror = () => addToast(t('toast.fileReadError'), 'error');
    reader.readAsText(file);
  };
  
  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: <Palette className="h-4 w-4" /> },
    { id: 'editor', label: t('settings.tabs.editor'), icon: <Pencil className="h-4 w-4" /> },
    { id: 'ai', label: t('settings.tabs.ai'), icon: <BrainCircuit className="h-4 w-4" /> },
    { id: 'data', label: t('settings.tabs.data'), icon: <Database className="h-4 w-4" /> },
  ];

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" 
        aria-modal="true"
        role="dialog"
    >
      <div 
        ref={modalRef}
        className={`bg-slate-50 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col transition-all duration-200 ease-out ${isEntering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.title')}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800" aria-label={t('settings.close')}>
                <X className="h-5 w-5" />
            </button>
        </div>
        
        <div className="flex border-b border-slate-200 dark:border-slate-800">
             <div className="p-4 border-r border-slate-200 dark:border-slate-800 w-48 flex-shrink-0">
                <SettingsRow label={t('settings.general.language')} direction='col'>
                    <SegmentedControl options={[{label: 'EN', value: 'en'}, {label: 'DE', value: 'de'}]} value={locale} onChange={(value) => setLocale(value)} />
                </SettingsRow>
                 <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left flex items-center gap-2 p-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
             </div>
            <div className="p-6 overflow-y-auto flex-1">
                {activeTab === 'appearance' && (
                    <div className="space-y-6">
                         <SettingsRow label={t('settings.appearance.density.label')}>
                            <SegmentedControl options={[{label: t('settings.appearance.density.compact'), value: 'compact'}, {label: t('settings.appearance.density.default'), value: 'default'}, {label: t('settings.appearance.density.comfortable'), value: 'comfortable'}]} value={settings.density} onChange={(value) => setSetting('density', value)} />
                        </SettingsRow>
                        <SettingsRow label={t('settings.appearance.font.label')}>
                            <select value={settings.font} onChange={(e) => setSetting('font', e.target.value as AppSettings['font'])} className="w-40 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm">
                                <option value="system-ui">{t('settings.appearance.font.system')}</option>
                                <option value="serif">{t('settings.appearance.font.serif')}</option>
                                <option value="monospace">{t('settings.appearance.font.monospace')}</option>
                            </select>
                        </SettingsRow>
                         <SettingsRow label={t('settings.appearance.reduceMotion')}>
                           <ToggleSwitch checked={settings.reduceMotion} onChange={(checked) => setSetting('reduceMotion', checked)} />
                        </SettingsRow>
                    </div>
                )}
                 {activeTab === 'editor' && (
                     <div className="space-y-6">
                         <SettingsRow label={t('settings.editor.autoSaveDelay')}>
                            <SegmentedControl options={[{label: '1.5s', value: 1500}, {label: '3s', value: 3000}, {label: '5s', value: 5000}]} value={settings.autoSaveDelay} onChange={(value) => setSetting('autoSaveDelay', value)} />
                         </SettingsRow>
                          <SettingsRow label={t('settings.editor.fontSize')}>
                            <SegmentedControl options={[{label: t('settings.editor.fontSizes.small'), value: 'small'}, {label: t('settings.editor.fontSizes.medium'), value: 'medium'}, {label: t('settings.editor.fontSizes.large'), value: 'large'}]} value={settings.editorFontSize} onChange={(value) => setSetting('editorFontSize', value)} />
                         </SettingsRow>
                         <SettingsRow label={t('settings.editor.defaultView')}>
                            <SegmentedControl options={[{label: t('editor.edit'), value: 'edit'}, {label: t('editor.preview'), value: 'preview'}]} value={settings.defaultEditorView} onChange={(value) => setSetting('defaultEditorView', value)} />
                         </SettingsRow>
                          <SettingsRow label={t('settings.editor.focusMode')}>
                           <ToggleSwitch checked={settings.focusMode} onChange={(checked) => setSetting('focusMode', checked)} />
                        </SettingsRow>
                         <SettingsRow label={t('settings.editor.showWordCount')}>
                           <ToggleSwitch checked={settings.showWordCount} onChange={(checked) => setSetting('showWordCount', checked)} />
                        </SettingsRow>
                    </div>
                )}
                {activeTab === 'ai' && (
                     <div className="space-y-6">
                        <SettingsRow label={t('aiPanel.analysis.settings.summaryLength')}>
                            <SegmentedControl options={[{label: t('aiPanel.analysis.settings.short'), value: 'short'}, {label: t('aiPanel.analysis.settings.detailed'), value: 'detailed'}]} value={settings.aiAgentDefaults.summaryLength} onChange={v => setAiSetting('summaryLength', v)} />
                        </SettingsRow>
                        <SettingsRow label={t('aiPanel.creative.settings.ideaCount')}>
                            <SegmentedControl options={[{label: '3', value: 3}, {label: '5', value: 5}, {label: '7', value: 7}]} value={settings.aiAgentDefaults.ideaCount} onChange={v => setAiSetting('ideaCount', v)} />
                        </SettingsRow>
                        <SettingsRow label={t('aiPanel.translate.settings.targetLanguage')}>
                            <select value={settings.aiAgentDefaults.targetLanguage} onChange={e => setAiSetting('targetLanguage', e.target.value as AiAgentSettings['targetLanguage'])} className="w-40 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm">
                                {AVAILABLE_LANGUAGES.map(lang => (
                                    <option key={lang.value} value={lang.value}>{t(lang.labelKey)}</option>
                                ))}
                            </select>
                        </SettingsRow>
                    </div>
                )}
                 {activeTab === 'data' && (
                    <div className="space-y-6">
                       <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('settings.data.export.title')}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{t('settings.data.export.description')}</p>
                            <div className="flex gap-2 mb-3">
                                {(['all', 'notes', 'templates', 'settings'] as const).map(type => (
                                    <button key={type} onClick={() => setExportType(type)} className={`w-full text-xs rounded-md py-1 capitalize transition-colors ${exportType === type ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                                        {t(`settings.data.export.types.${type}`)}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => onExport(exportType)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                                <FileDown className="h-4 w-4" /> {t('settings.data.export.button')}
                            </button>
                        </div>
                         <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('settings.data.import.title')}</h3>
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 p-3 rounded-md mb-4 text-sm">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                    <p><span className="font-bold">{t('warning')}:</span> {t('settings.data.import.warning')}</p>
                                </div>
                            </div>
                             <input type="file" accept=".json,application/json" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/50 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-900" />
                            <button onClick={handleImportClick} disabled={!file} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                                <FileUp className="h-4 w-4" /> {t('settings.data.import.button')}
                            </button>
                         </div>
                    </div>
                )}
            </div>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-100 dark:bg-slate-950/50 rounded-b-lg">
            <button onClick={resetSettings} className="text-sm text-slate-500 hover:text-red-500 hover:underline">
                {t('settings.reset')}
            </button>
        </div>
      </div>
    </div>
  );
};

const SettingsRow: React.FC<{label: string; children: React.ReactNode; direction?: 'row' | 'col'}> = ({ label, children, direction='row' }) => (
    <div className={`flex justify-between items-center ${direction === 'col' ? 'flex-col items-start gap-2' : ''}`}>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <div>{children}</div>
    </div>
);

const SegmentedControl: React.FC<{options: {label: string, value: any}[], value: any, onChange: (value: any) => void}> = ({ options, value, onChange }) => (
    <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
        {options.map(opt => (
            <button key={opt.label} onClick={() => onChange(opt.value)} className={`text-xs rounded-sm px-3 py-1 transition-colors ${value === opt.value ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'}`}>
                {opt.label}
            </button>
        ))}
    </div>
);

const ToggleSwitch: React.FC<{checked: boolean, onChange: (checked: boolean) => void}> = ({ checked, onChange }) => (
     <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
);


export default SettingsModal;