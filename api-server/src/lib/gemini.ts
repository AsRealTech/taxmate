 import {GoogleGenAI} from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_BASE_URLbbbb must be set. Did you forget to provision the OpenAI AI integration?"
  );
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_API_KEYbbbb must be set. Did you forget to provision the OpenAI AI integration?"
  );
}

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


