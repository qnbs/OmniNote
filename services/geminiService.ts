
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BrainstormSuggestion, PlannerSuggestion, ResearchSuggestion, TranslateSuggestion, FormatSuggestion, ImageSuggestion, AiRecipeResult } from "../types";

const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("Google AI API Key is not configured. AI features are disabled.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
}

const getLanguageInstruction = (locale: 'en' | 'de') => {
  if (locale === 'de') {
    return 'The response must be in German.';
  }
  return '';
};


// --- Type Guards for API Responses ---

function isAnalysisResult(obj: any): obj is { summary: string; tags: string[] } {
    return (
        obj &&
        typeof obj.summary === 'string' &&
        Array.isArray(obj.tags) &&
        obj.tags.every((t: any) => typeof t === 'string')
    );
}

function isBrainstormSuggestion(obj: any): obj is BrainstormSuggestion {
    return obj && Array.isArray(obj.ideas) && obj.ideas.every((i: any) => typeof i === 'string');
}

function isPlannerSuggestion(obj: any): obj is PlannerSuggestion {
    return obj && Array.isArray(obj.tasks) && obj.tasks.every((t: any) => typeof t === 'string');
}

function isTranslateSuggestion(obj: any): obj is TranslateSuggestion {
    return obj && typeof obj.translatedText === 'string';
}

function isFormatSuggestion(obj: any): obj is FormatSuggestion {
    return obj && typeof obj.formattedText === 'string';
}

function isTitledContentWithTagsResult(obj: any): obj is AiRecipeResult {
    return (
        obj &&
        typeof obj.title === 'string' &&
        typeof obj.content === 'string' &&
        Array.isArray(obj.tags) &&
        obj.tags.every((t: any) => typeof t === 'string')
    );
}

function isMeetingAnalysisResult(obj: any): obj is AiRecipeResult {
    return obj && typeof obj.title === 'string' && typeof obj.content === 'string';
}

// --- Generic Helpers for API Calls ---

async function generateAndParseJSON<T>(
  prompt: string,
  config: any, // The config object for generateContent, excluding model and contents
  typeGuard: (obj: any) => obj is T
): Promise<T> {
  const ai = getAiClient();
  const result: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: config,
  });

  try {
    const textResponse = result.text?.trim();
    if (!textResponse) {
        throw new Error("Received an empty response from the AI.");
    }
    const parsed = JSON.parse(textResponse);
    if (typeGuard(parsed)) {
      return parsed;
    }
    throw new Error("Parsed JSON does not match the expected format.");
  } catch (e: any) {
    console.error("Failed to parse JSON from Gemini:", result.text, e);
    const errorMessage = e.message.includes("format") 
        ? "Received invalid data structure from AI." 
        : "Received invalid JSON from AI.";
    throw new Error(errorMessage);
  }
}

async function generateStream(prompt: string, onChunk: (chunk: string) => void) {
    const ai = getAiClient();
    const result = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    for await (const chunk of result) {
        onChunk(chunk.text);
    }
}


// --- API Service Functions ---

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A summary of the note's content.",
    },
    tags: {
      type: Type.ARRAY,
      description: "A list of 3-5 relevant lowercase keyword tags.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["summary", "tags"],
};

export const getSummaryAndTags = async (content: string, options: { length: 'short' | 'detailed' }, locale: 'en' | 'de'): Promise<{ summary: string; tags: string[] }> => {
  const langInstruction = getLanguageInstruction(locale);
  const summaryInstruction = options.length === 'detailed' 
    ? "The summary should be a detailed paragraph."
    : "The summary should be a concise 1-2 sentences.";
  
  return generateAndParseJSON(
    `Analyze the following note content and provide a summary and relevant tags. ${summaryInstruction} ${langInstruction} Note content: "${content}"`,
    { responseMimeType: "application/json", responseSchema: analysisSchema },
    isAnalysisResult
  );
};

export const getSummaryStream = async (content: string, options: { length: 'short' | 'detailed' }, locale: 'en' | 'de', onChunk: (chunk: string) => void) => {
    const langInstruction = getLanguageInstruction(locale);
    const summaryInstruction = options.length === 'detailed' 
    ? "The summary should be a detailed paragraph."
    : "The summary should be a concise 1-2 sentences.";
    const prompt = `Summarize the following note. ${summaryInstruction} ${langInstruction} Note content: "${content}"`;
    await generateStream(prompt, onChunk);
}

const brainstormSchema = {
  type: Type.OBJECT,
  properties: {
    ideas: {
      type: Type.ARRAY,
      description: "A list of creative ideas, next steps, or related concepts.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["ideas"],
};

export const getBrainstormingIdeas = async (content: string, options: { count: 3 | 5 | 7 }, locale: 'en' | 'de'): Promise<BrainstormSuggestion> => {
    const langInstruction = getLanguageInstruction(locale);
    return generateAndParseJSON(
        `Based on the following note, brainstorm exactly ${options.count} creative ideas or next steps. Keep each idea concise. ${langInstruction} Note content: "${content}"`,
        {
          responseMimeType: "application/json",
          responseSchema: brainstormSchema,
        },
        isBrainstormSuggestion
    );
};

export const getBrainstormingIdeasStream = async (content: string, options: { count: 3 | 5 | 7 }, locale: 'en' | 'de', onChunk: (chunk: string) => void) => {
    const langInstruction = getLanguageInstruction(locale);
    const prompt = `Based on the following note, brainstorm exactly ${options.count} creative ideas or next steps. Format each idea on a new line, starting with '- '. ${langInstruction} Note content: "${content}"`;
    await generateStream(prompt, onChunk);
}

const plannerSchema = {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        description: "A list of actionable tasks or steps to achieve the goal described in the note.",
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ["tasks"],
  };
  
export const getTaskPlan = async (content: string, options: { detail: 'simple' | 'detailed' }, locale: 'en' | 'de'): Promise<PlannerSuggestion> => {
      const langInstruction = getLanguageInstruction(locale);
      const promptDetail = options.detail === 'detailed' 
        ? "create a detailed, granular plan of actionable steps. Include sub-tasks if necessary."
        : "create a simple plan of 3-5 high-level actionable steps.";

      return generateAndParseJSON(
        `Based on the following note, ${promptDetail}. ${langInstruction} Note content: "${content}"`,
        { responseMimeType: "application/json", responseSchema: plannerSchema },
        isPlannerSuggestion
      );
};

export const getTaskPlanStream = async (content: string, options: { detail: 'simple' | 'detailed' }, locale: 'en' | 'de', onChunk: (chunk: string) => void) => {
      const langInstruction = getLanguageInstruction(locale);
      const promptDetail = options.detail === 'detailed' 
        ? "create a detailed, granular plan of actionable steps. Include sub-tasks if necessary."
        : "create a simple plan of 3-5 high-level actionable steps.";
      const prompt = `Based on the following note, ${promptDetail}. Format each task on a new line starting with '- '. ${langInstruction} Note content: "${content}"`;
      await generateStream(prompt, onChunk);
}

export const getResearchLinks = async (content: string, locale: 'en' | 'de'): Promise<ResearchSuggestion> => {
  const ai = getAiClient();
  const langInstruction = getLanguageInstruction(locale);
  const result: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Based on the following note, provide a concise answer and list relevant online resources. ${langInstruction} Note: "${content.substring(0, 500)}"`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const answer = result.text;
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  const sources = groundingChunks.map((chunk) => {
      return {
          title: chunk.web?.title || 'Untitled Source',
          uri: chunk.web?.uri || '#',
      };
  }).filter(item => item.uri !== '#');

  if (!answer && sources.length === 0) {
      const message = locale === 'de'
        ? "Keine Online-Ergebnisse zu diesem Thema gefunden. Versuchen Sie, Ihren Notizinhalt zu verfeinern, um bessere Rechercheergebnisse zu erzielen."
        : "No online results found for this topic. Try refining your note content for better research results.";

      return {
          answer: message,
          sources: []
      }
  }

  return { answer, sources: sources.slice(0, 3) };
};

const translationSchema = {
    type: Type.OBJECT,
    properties: {
        translatedText: { type: Type.STRING }
    },
    required: ["translatedText"],
};

export const translateNote = async (content: string, language: string): Promise<TranslateSuggestion> => {
    return generateAndParseJSON(
        `Translate the following text to ${language}. Preserve the original markdown formatting. Text: "${content}"`,
        { responseMimeType: "application/json", responseSchema: translationSchema },
        isTranslateSuggestion
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
    return generateAndParseJSON(
        `Format the following text into clean and well-structured Markdown. Add headings, lists, and other elements where appropriate to improve readability. Text: "${content}"`,
        { responseMimeType: "application/json", responseSchema: formatSchema },
        isFormatSuggestion
    );
};

export const generateImageFromNote = async (
    noteTitle: string, 
    noteContent: string, 
    style: string,
    aspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16'
): Promise<ImageSuggestion> => {
    const ai = getAiClient();
    const stylePrompt = style === 'default' ? '' : `, in the style of ${style}`;
    const prompt = `Generate an image based on the following note${stylePrompt}. Title: "${noteTitle}". Content: "${noteContent.substring(0, 250)}". Focus on creating a visually compelling representation of the key concepts.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });
    
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("Image generation failed to return an image.");
    }
    return { imageBytes: base64ImageBytes };
};


// AI Recipes
const blogPostSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A catchy, SEO-friendly title for the blog post." },
        content: { type: Type.STRING, description: "The full blog post content, formatted in Markdown, including an introduction, several sections with headings, and a conclusion." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 5 relevant tags for the blog post." }
    },
    required: ["title", "content", "tags"]
};

export const runBlogPostRecipe = async (originalTitle: string, noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
    const langInstruction = getLanguageInstruction(locale);
    return generateAndParseJSON(
        `Take the following note content and expand it into a well-structured blog post. The original title was "${originalTitle}". Create a new catchy title, write the full content in Markdown, and suggest 5 tags. ${langInstruction} Note: "${noteContent}"`,
        { responseMimeType: "application/json", responseSchema: blogPostSchema },
        isTitledContentWithTagsResult
    );
};


const meetingAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A new title for the note in the format 'Meeting Summary: [Original Topic] - [Date]'." },
        content: { type: Type.STRING, description: "A summary of the meeting formatted in Markdown. It must include three sections: 'Key Decisions', 'Action Items' (as a Markdown checklist), and 'General Summary'." }
    },
    required: ["title", "content"]
}

export const runMeetingAnalysisRecipe = async (noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
     const langInstruction = getLanguageInstruction(locale);
     const titleFormat = locale === 'de' ? "'Meeting-Zusammenfassung: [Originalthema] - [Datum]'" : "'Meeting Summary: [Original Topic] - [Date]'";
     const sections = locale === 'de'
        ? "'Wichtige Entscheidungen', 'Aktionspunkte' (als Markdown-Checkliste) und 'Allgemeine Zusammenfassung'"
        : "'Key Decisions', 'Action Items' (as a Markdown checklist), and 'General Summary'";

     return generateAndParseJSON(
        `Analyze the following meeting notes. Create a new title for the summary including today's date (${new Date().toLocaleDateString()}) in the format ${titleFormat}. Then, write a new note content that extracts and summarizes the key decisions, lists all action items as a markdown checklist, and provides a general summary. The response must include three sections: ${sections}. ${langInstruction} Notes: "${noteContent}"`,
        { responseMimeType: "application/json", responseSchema: meetingAnalysisSchema },
        isMeetingAnalysisResult
    );
}

const socialPostSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A short, descriptive title for the note, summarizing the social post's topic." },
        content: { type: Type.STRING, description: "The content for a social media post (e.g., for LinkedIn or X), formatted in Markdown, including 3-5 relevant hashtags at the end." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 3-5 relevant keyword tags for the note itself." }
    },
    required: ["title", "content", "tags"]
};

export const runSocialPostRecipe = async (noteContent: string, locale: 'en' | 'de'): Promise<AiRecipeResult> => {
    const langInstruction = getLanguageInstruction(locale);
    return generateAndParseJSON(
        `From the following note, draft a concise and engaging social media post. Create a new, short title for the note. Write the post content in Markdown, ending with 3-5 relevant hashtags. Suggest 3-5 keyword tags for the note. ${langInstruction} Note: "${noteContent}"`,
        { responseMimeType: "application/json", responseSchema: socialPostSchema },
        isTitledContentWithTagsResult
    );
};
