import { Module, OnModuleInit } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { MaxMessageLengthRule } from './rules/max-message-length.rule';
import { ProfanityRule } from './rules/profanity.rule';
import { PromptInjectionRule } from './rules/prompt-injection.rule';

@Module({
    providers: [
        ValidationService,
        MaxMessageLengthRule,
        ProfanityRule,
        PromptInjectionRule,
    ],
    exports: [ValidationService],
})
export class ValidationModule implements OnModuleInit {
    constructor(
        private service: ValidationService,
        private maxMessageLengthRule: MaxMessageLengthRule,
        private profanityRule: ProfanityRule,
        private promptInjectionRule: PromptInjectionRule,
    ) { }

    onModuleInit() {
        this.service.registerRule(this.maxMessageLengthRule);
        this.service.registerRule(this.profanityRule);
        this.service.registerRule(this.promptInjectionRule);
    }
}
