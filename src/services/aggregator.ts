import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import { ProviderConfig, ProviderResponse } from "./providers/types";

export class AIAggregator {
  private providers = [
    new GeminiProvider(),
    new GroqProvider(),
  ];

  getProviders() {
    return this.providers;
  }

  async runAll(prompt: string, configs: Record<string, ProviderConfig>): Promise<ProviderResponse[]> {
    const tasks = this.providers.map(async (provider) => {
      const config = configs[provider.name];
      if (!config) return null;
      return provider.complete(prompt, config);
    });

    const results = await Promise.all(tasks);
    return results.filter((r): r is ProviderResponse => r !== null);
  }
}

export const aggregator = new AIAggregator();
