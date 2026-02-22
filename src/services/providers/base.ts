import { AIProvider, ProviderConfig, ProviderResponse } from "./types";

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  abstract availableModels: string[];
  abstract hasApiKey: boolean;

  abstract complete(prompt: string, config: ProviderConfig): Promise<ProviderResponse>;

  protected createErrorResponse(model: string, error: unknown): ProviderResponse {
    return {
      content: "",
      providerName: this.name,
      model,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
