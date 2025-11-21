
// --- Advanced AI Types ---

export interface AnalysisEntity {
  name: string;
  category: 'person' | 'place' | 'concept' | 'org' | 'other';
}

export interface AdvancedAnalysisResult {
  summary: string;
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  complexityScore: number; // 1-10
  keyEntities: AnalysisEntity[];
}

export interface BrainstormSuggestion {
  ideas: string[];
}

export interface PlanTask {
  title: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
  subtasks?: string[];
}

export interface StrategicPlanResult {
  goal: string;
  tasks: PlanTask[];
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
    | AdvancedAnalysisResult
    | BrainstormSuggestion
    | StrategicPlanResult
    | ResearchSuggestion
    | TranslateSuggestion
    | FormatSuggestion
    | ImageSuggestion
    | AiRecipeResult;

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export type AgentStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export type AgentFeedback = 'positive' | 'negative' | null;

export interface AgentMeta {
    status: AgentStatus;
    error: string | null;
    latency: number | null;
    feedback: AgentFeedback;
    lastRunAt: number | null;
}

export interface AiAgentSettings {
    // Analysis
    analysisDepth: 'standard' | 'deep';
    summaryLength: 'short' | 'detailed';
    // Creative
    ideaCount: 3 | 5 | 7;
    creativityLevel: 'conservative' | 'balanced' | 'wild';
    // Planner
    planDetail: 'simple' | 'strategic';
    // Translate
    targetLanguage: 'English' | 'German';
    // Image
    imageStyle: 'default' | 'photorealistic' | 'watercolor' | 'anime' | 'cyberpunk';
    imageAspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16';
    imageQuality: 'standard' | 'hd';
    // Chat
    chatPersona: 'helpful' | 'socratic' | 'critic' | 'coder';
}
