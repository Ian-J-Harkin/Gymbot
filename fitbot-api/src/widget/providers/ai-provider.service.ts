import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';
import { OpenAiProvider } from './openai.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { OllamaProvider } from './ollama.provider';
import { HuggingFaceProvider } from './huggingface.provider';
import { AI_PROVIDERS } from '../../common/constants';

@Injectable()
export class AiProviderService {
    constructor(
        private openAiProvider: OpenAiProvider,
        private openRouterProvider: OpenRouterProvider,
        private ollamaProvider: OllamaProvider,
        private huggingFaceProvider: HuggingFaceProvider,
    ) { }

    getProvider(providerName: string): AiProvider {
        switch (providerName) {
            case AI_PROVIDERS.OPENAI:
                return this.openAiProvider;
            case AI_PROVIDERS.OPENROUTER:
                return this.openRouterProvider;
            case AI_PROVIDERS.OLLAMA:
                return this.ollamaProvider;
            case AI_PROVIDERS.HUGGINGFACE:
                return this.huggingFaceProvider;
            default:
                throw new InternalServerErrorException(`Unknown AI provider: ${providerName}`);
        }
    }
}
