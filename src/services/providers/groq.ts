/// <reference types="vite/client" />
import Groq from "groq-sdk";
import { BaseProvider } from "./base";
import { ProviderConfig, ProviderResponse } from "./types";

export class GroqProvider extends BaseProvider {
  name = "Groq";
  availableModels = [
    "llama-3.1-8b-instant",
    "llama-3.1-70b-versatile",
    "mixtral-8x7b-instruct"
  ];

  get hasApiKey(): boolean {
    return !!import.meta.env.VITE_GROQ_API_KEY;
  }

  async complete(prompt: string, config: ProviderConfig): Promise<ProviderResponse> {
    const startTime = Date.now();
    try {
      if (!this.hasApiKey) {
        throw new Error("Groq API Key is missing (VITE_GROQ_API_KEY)");
      }

      const groq = new Groq({
        apiKey: import.meta.env.VITE_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const response = await groq.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      const latency = Date.now() - startTime;
      const content = response.choices[0]?.message?.content || "No response content";

      return {
        content,
        providerName: this.name,
        model: config.model,
        latency,
        tokensUsed: response.usage ? {
          prompt: response.usage.prompt_tokens,
          completion: response.usage.completion_tokens,
          total: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      return this.createErrorResponse(config.model, error);
    }
  }
}
