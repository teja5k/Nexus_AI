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
  enabled?: boolean;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  responses: {
    provider: string;
    model: string;
    content: string;
    error?: string;
  }[];
  temperature: number;
  timestamp: string;
}

export interface AIProvider {
  name: string;
  availableModels: string[];
  hasApiKey: boolean;
  complete(prompt: string, config: ProviderConfig): Promise<ProviderResponse>;
}
