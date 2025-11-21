
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BrainstormSuggestion, StrategicPlanResult, ResearchSuggestion, TranslateSuggestion, FormatSuggestion, ImageSuggestion, AiRecipeResult, ChatMessage, AdvancedAnalysisResult, AiAgentSettings } from "../core/types/ai";

const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("Google AI API Key is not configured. AI features are disabled.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
}

// --- Sophisticated Language & Persona Engine ---

const getSophisticatedInstruction = (locale: 'en' | 'de', context: 'analytical' | 'creative' | 'strategic' | 'technical' = 'analytical') => {
  const styles = {
    en: {
      analytical: "Adopt the persona of a Chief Intelligence Officer. Output must be rigorously empirical, identifying latent patterns, structural contradictions, and second-order effects. Use precise, high-register vocabulary.",
      creative: "Adopt the persona of a Visionary Director. Prioritize lateral thinking, metaphorical resonance, and aesthetic coherence. Avoid clichés; seek the 'oblique angle' and novel synthesis.",
      strategic: "Adopt the persona of a Management Consultant (MBB level). Focus on MECE (Mutually Exclusive, Collectively Exhaustive) frameworks, critical path analysis, and high-leverage interventions. Be action-oriented and risk-aware.",
      technical: "Adopt the persona of a Distinguished Engineer. Focus on system design, scalability, corner cases, and idiomatic patterns. Prefer robust, maintainable solutions over clever hacks."
    },
    de: {
      analytical: "Agieren Sie als Chefanalyst. Die Ausgabe muss rigoros empirisch sein und latente Muster, strukturelle Widersprüche sowie Effekte zweiter Ordnung identifizieren. Verwenden Sie eine präzise, gehobene Fachsprache. Sprechen Sie den Nutzer formell (Sie) an.",
      creative: "Agieren Sie als visionärer Creative Director. Priorisieren Sie laterales Denken, metaphorische Resonanz und ästhetische Kohärenz. Vermeiden Sie Klischees; suchen Sie innovative Synthesen. Sprechen Sie den Nutzer formell (Sie) an.",
      strategic: "Agieren Sie als Strategieberater (Top-Tier). Fokussieren Sie auf MECE-Frameworks, Analyse des kritischen Pfads und Maßnahmen mit hoher Hebelwirkung. Seien Sie handlungsorientiert und risikobewusst. Formelle Ansprache (Sie).",
      technical: "Agieren Sie als Principal Software Architect. Fokussieren Sie auf Systemdesign, Skalierbarkeit, Randfälle und idiomatische Muster. Bevorzugen Sie robuste, wartbare Lösungen. Formelle Ansprache (Sie)."
    }
  };

  const base = locale === 'de' 
    ? "Antworten Sie in makellosem, akademisch präzisem Hochdeutsch." 
    : "Answer in flawless, articulate, and professionally polished English.";

  return `${base} ${styles[locale][context] || styles[locale].analytical}`;
};

// --- Retry Logic ---

interface ApiError extends Error {
    status?: number;
}

async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error: unknown) {
        const apiError = error as ApiError;
        const message = apiError.message || '';
        if (retries > 0 && (apiError.status === 429 || apiError.status === 503 || message.includes('429') || message.includes('503'))) {
            console.warn(`API Error ${apiError.status}. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}

// --- Generic Helpers ---

async function generateAndParseJSON<T>(
  model: string,
  prompt: string,
  config: Record<string, unknown>,
): Promise<T> {
  const ai = getAiClient();
  
  return withRetry(async () => {
      const result: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            ...config,
            responseMimeType: "application/json" // Enforce JSON
        },
      });

      const textResponse = result.text?.trim();
      if (!textResponse) throw new Error("Received an empty response from the AI.");
      
      try {
          return JSON.parse(textResponse) as T;
      } catch (e) {
           throw new Error("Failed to parse JSON response.");
      }
  });
}


// --- Advanced API Service Functions ---

const advancedAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A sophisticated executive summary." },
    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5-7 highly relevant taxonomy tags." },
    sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative", "mixed"] },
    complexityScore: { type: Type.INTEGER },
    keyEntities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["person", "place", "concept", "org", "other"] }
        },
        required: ["name", "category"]
      }
    }
  },
  required: ["summary", "tags", "sentiment", "complexityScore", "keyEntities"],
};

export const getAnalysis = async (content: string, options: { depth: 'standard' | 'deep' }, locale: 'en' | 'de'): Promise<AdvancedAnalysisResult> => {
  const instruction = getSophisticatedInstruction(locale, 'analytical');
  const isDeep = options.depth === 'deep';
  const model = isDeep ? "gemini-3-pro-preview" : "gemini-2.5-flash";
  // Budget for thinking models
  const thinkingConfig = isDeep ? { thinkingConfig: { thinkingBudget: 4096 } } : {};

  const prompt = `
    Analyze the following text.
    1. Synthesize an executive summary.
    2. Evaluate semantic complexity (1-10).
    3. Extract key entities.
    4. Determine sentiment.
    ${instruction}
    
    Text: "${content.substring(0, 10000)}"
  `;
  
  return generateAndParseJSON<AdvancedAnalysisResult>(
    model,
    prompt,
    { 
        responseSchema: advancedAnalysisSchema,
        systemInstruction: "You are an elite intelligence analyst. Output strict JSON.",
        ...thinkingConfig
    }
  );
};

const brainstormSchema = {
  type: Type.OBJECT,
  properties: {
    ideas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["ideas"],
};

export const getBrainstormingIdeas = async (content: string, options: { count: number, level: string }, locale: 'en' | 'de'): Promise<BrainstormSuggestion> => {
    const instruction = getSophisticatedInstruction(locale, 'creative');
    const temperature = options.level === 'wild' ? 1.4 : options.level === 'balanced' ? 0.9 : 0.5;
    
    return generateAndParseJSON<BrainstormSuggestion>(
        "gemini-2.5-flash",
        `
        Context: "${content.substring(0, 5000)}"
        Task: Brainstorm exactly ${options.count} distinct ideas.
        ${instruction}
        `,
        {
          responseSchema: brainstormSchema,
          temperature: temperature,
          systemInstruction: "You are a world-class creative strategist. Output strict JSON."
        }
    );
};

const strategicPlanSchema = {
    type: Type.OBJECT,
    properties: {
      goal: { type: Type.STRING },
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
            estimatedTime: { type: Type.STRING },
            subtasks: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "priority"]
        },
      },
    },
    required: ["goal", "tasks"],
  };
  
export const getStrategicPlan = async (content: string, options: { detail: 'simple' | 'strategic' }, locale: 'en' | 'de'): Promise<StrategicPlanResult> => {
      const instruction = getSophisticatedInstruction(locale, 'strategic');
      const isStrategic = options.detail === 'strategic';
      const model = isStrategic ? "gemini-3-pro-preview" : "gemini-2.5-flash";
      const thinkingConfig = isStrategic ? { thinkingConfig: { thinkingBudget: 4096 } } : {};

      return generateAndParseJSON<StrategicPlanResult>(
        model,
        `
        Context: "${content.substring(0, 10000)}"
        Task: Create a plan.
        ${instruction}
        `,
        { 
            responseSchema: strategicPlanSchema,
            systemInstruction: "You are a senior project director. Output strict JSON.",
            ...thinkingConfig
        }
      );
};

export const getResearchLinks = async (content: string, locale: 'en' | 'de'): Promise<ResearchSuggestion> => {
  const ai = getAiClient();
  const instruction = getSophisticatedInstruction(locale, 'analytical');
  
  const prompt = `
    Identify key claims or entities that require verification.
    Provide a synthesis answering implicit questions.
    Use Google Search for authoritative sources.
    
    Context: "${content.substring(0, 2000)}"
    
    ${instruction}
  `;

  const result: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const answer = result.text || "";
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  const sources = groundingChunks.map((chunk) => {
      return {
          title: chunk.web?.title || 'Source',
          uri: chunk.web?.uri || '#',
      };
  }).filter(item => item.uri && item.uri !== '#');

  return { answer, sources: sources.slice(0, 5) };
};

const translationSchema = {
    type: Type.OBJECT,
    properties: {
        translatedText: { type: Type.STRING }
    },
    required: ["translatedText"],
};

export const translateNote = async (content: string, language: string): Promise<TranslateSuggestion> => {
    return generateAndParseJSON<TranslateSuggestion>(
        "gemini-2.5-flash",
        `
        Translate to ${language}. Maintain Markdown.
        Text: "${content}"
        `,
        { responseSchema: translationSchema }
    );
};

const formatSchema = {
    type: Type.OBJECT,
    properties: {
        formattedText: { type: Type.STRING }
    },
    required: ["formattedText"],
};

export const formatNote = async (content: string): Promise<FormatSuggestion> => {
    return generateAndParseJSON<FormatSuggestion>(
        "gemini-2.5-flash",
        `Refactor into professional Markdown. Text: "${content}"`,
        { responseSchema: formatSchema }
    );
};

export const generateImageFromNote = async (
    noteTitle: string, 
    noteContent: string, 
    style: string,
    aspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16',
    quality: 'standard' | 'hd'
): Promise<ImageSuggestion> => {
    const ai = getAiClient();
    
    const styleDescriptor = style; // Simplified for brevity, map in UI or here if needed

    const prompt = `
        Create an image for concept: "${noteTitle}".
        Context: "${noteContent.substring(0, 500)}".
        Style: ${styleDescriptor}.
    `;
    
    const isHd = quality === 'hd';
    const model = isHd ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const config: Record<string, unknown> = {
        imageConfig: {
            aspectRatio: aspectRatio,
        }
    };

    if (isHd) {
        (config.imageConfig as Record<string, unknown>).imageSize = "2K";
    }
    
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: config,
    });
    
    let base64ImageBytes: string | undefined;

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64ImageBytes = part.inlineData.data;
                break;
            }
        }
    }

    if (!base64ImageBytes) {
        throw new Error("Image generation failed.");
    }
    
    return { imageBytes: base64ImageBytes };
};


// --- AI Recipes ---

const blogPostSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["title", "content", "tags"]
};

export const runBlogPostRecipe = async (originalTitle: string, noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
    const instruction = getSophisticatedInstruction(locale, 'creative');
    return generateAndParseJSON<AiRecipeResult>(
        "gemini-2.5-flash",
        `
        Transform notes into a blog post.
        Original Context: "${originalTitle}"
        Notes: "${noteContent.substring(0, 10000)}"
        ${instruction}
        `,
        { responseSchema: blogPostSchema }
    );
};


const meetingAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING }
    },
    required: ["title", "content"]
}

export const runMeetingAnalysisRecipe = async (noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
     const instruction = getSophisticatedInstruction(locale, 'strategic');
     return generateAndParseJSON<AiRecipeResult>(
        "gemini-3-pro-preview",
        `
        Synthesize meeting notes into executive briefing.
        Raw Notes: "${noteContent.substring(0, 10000)}"
        ${instruction}
        `,
        { 
            responseSchema: meetingAnalysisSchema,
            systemInstruction: "You are an executive secretary. Output strict JSON.",
            thinkingConfig: { thinkingBudget: 2048 }
        }
    );
}

const socialPostSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["title", "content", "tags"]
};

export const runSocialPostRecipe = async (noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
    const instruction = getSophisticatedInstruction(locale, 'creative');
    return generateAndParseJSON<AiRecipeResult>(
        "gemini-2.5-flash",
        `
        Draft a social media post.
        Notes: "${noteContent.substring(0, 5000)}"
        ${instruction}
        `,
        { responseSchema: socialPostSchema }
    );
};

// --- Chat Logic ---
// Kept largely the same but ensured types

const CHAT_INSTRUCTIONS = {
    en: {
        base: "You are an intelligent knowledge assistant. Answer based on context.\n\n",
        socratic: "\n\nPERSONA: Socratic Mentor.",
        critic: "\n\nPERSONA: Principal Reviewer.",
        coder: "\n\nPERSONA: Staff Engineer."
    },
    de: {
        base: "Sie sind ein intelligenter Wissensassistent. Antworten Sie basierend auf dem Kontext.\n\n",
        socratic: "\n\nPERSONA: Sokratischer Mentor.",
        critic: "\n\nPERSONA: Chef-Kritiker.",
        coder: "\n\nPERSONA: Software Architect."
    }
};

export const streamChatWithNote = async (
    noteContent: string,
    history: ChatMessage[],
    message: string,
    persona: string,
    onChunk: (text: string) => void,
    locale: 'en' | 'de' = 'en'
) => {
    const ai = getAiClient();
    const formattedHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const instructions = CHAT_INSTRUCTIONS[locale];
    let systemInstruction = `${instructions.base}--- CONTEXT ---\n${noteContent.substring(0, 20000)}\n--- END CONTEXT ---`;
    
    // Mapping logic for personas
    if (persona === 'socratic') systemInstruction += instructions.socratic;
    if (persona === 'critic') systemInstruction += instructions.critic;
    if (persona === 'coder') systemInstruction += instructions.coder;

    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction },
        history: formattedHistory
    });

    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
        if(chunk.text) {
            onChunk(chunk.text);
        }
    }
};
