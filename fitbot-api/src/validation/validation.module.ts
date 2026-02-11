import { Module, OnModuleInit } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { MaxMessageLengthRule } from './rules/max-message-length.rule';

@Module({
    providers: [
        ValidationService,
        MaxMessageLengthRule,
    ],
    exports: [ValidationService],
})
export class ValidationModule implements OnModuleInit {
    constructor(
        private service: ValidationService,
        private maxMessageLengthRule: MaxMessageLengthRule,
    ) { }

    onModuleInit() {
        this.service.registerRule(this.maxMessageLengthRule);
    }
}
