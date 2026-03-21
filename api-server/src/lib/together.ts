 import { Together } from "together-ai";
 
if (!process.env.TOGETHER_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_TOGETHER_API_KEY must be set. Did you forget to provision the Together AI integration?"
  );
}

export const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});
