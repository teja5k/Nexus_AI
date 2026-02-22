import { GoogleGenAI } from "@google/genai";
import { BaseProvider } from "./base";
import { ProviderConfig, ProviderResponse } from "./types";

export class GeminiProvider extends BaseProvider {
  name = "Google Gemini";
  availableModels = [
    "gemini-3-flash-preview",
    "gemini-3.1-pro-preview",
    "gemini-2.5-flash-lite-latest"
  ];

  get hasApiKey(): boolean {
    // For dynamic keys, we check at runtime in complete()
    return true;
  }

  async complete(prompt: string, config: ProviderConfig): Promise<ProviderResponse> {
    const startTime = Date.now();
    try {
      const apiKey = config.apiKey;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please enter it in the configuration sidebar.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
        },
      });

      const latency = Date.now() - startTime;
      
      return {
        content: response.text || "No response content",
        providerName: this.name,
        model: config.model,
        latency,
        tokensUsed: response.usageMetadata ? {
          prompt: response.usageMetadata.promptTokenCount,
          completion: response.usageMetadata.candidatesTokenCount,
          total: response.usageMetadata.totalTokenCount,
        } : undefined,
      };
    } catch (error) {
      return this.createErrorResponse(config.model, error);
    }
  }
}
