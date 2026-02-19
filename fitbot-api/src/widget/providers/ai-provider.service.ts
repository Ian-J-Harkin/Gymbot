import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';
import { OpenAiProvider } from './openai.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { OllamaProvider } from './ollama.provider';
import { AI_PROVIDERS } from '../../common/constants';

@Injectable()
export class AiProviderService {
    constructor(
        private openAiProvider: OpenAiProvider,
        private openRouterProvider: OpenRouterProvider,
        private ollamaProvider: OllamaProvider,
    ) { }

    getProvider(providerName: string): AiProvider {
        switch (providerName) {
            case AI_PROVIDERS.OPENAI:
                return this.openAiProvider;
            case AI_PROVIDERS.OPENROUTER:
                return this.openRouterProvider;
            case AI_PROVIDERS.OLLAMA:
                return this.ollamaProvider;
            default:
                throw new InternalServerErrorException(`Unknown AI provider: ${providerName}`);
        }
    }
}
