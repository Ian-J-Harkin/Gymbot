
import { IsString, IsNotEmpty, IsHexColor, IsOptional, IsIn } from 'class-validator';

export class UpdateConfigurationDto {
    @IsString()
    @IsNotEmpty()
    faqText: string;

    @IsString()
    @IsNotEmpty()
    @IsHexColor()
    widgetColor: string;

    @IsString()
    @IsIn(['openai', 'openrouter', 'ollama'])
    aiProvider: string;

    @IsString()
    @IsOptional()
    openAiApiKey?: string;

    @IsString()
    @IsOptional()
    openRouterApiKey?: string;

    @IsString()
    @IsOptional()
    ollamaUrl?: string;

    @IsString()
    @IsOptional()
    ollamaModel?: string;
}
