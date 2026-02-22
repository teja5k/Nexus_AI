export interface ProviderResponse {
  content: string;
  providerName: string;
  model: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  error?: string;
  latency?: number;
}

export interface ProviderConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
}

export interface AIProvider {
  name: string;
  availableModels: string[];
  hasApiKey: boolean;
  complete(prompt: string, config: ProviderConfig): Promise<ProviderResponse>;
}
