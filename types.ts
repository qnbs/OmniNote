
export * from './core/types/common';
export * from './core/types/note';
export * from './core/types/ai';
export * from './core/types/settings';
export * from './core/types/graph';

import { AiAgentSettings } from './core/types/ai';

export const AVAILABLE_LANGUAGES: { value: AiAgentSettings['targetLanguage'], labelKey: string }[] = [
    { value: 'English', labelKey: 'languages.english' },
    { value: 'German', labelKey: 'languages.german' }
];
