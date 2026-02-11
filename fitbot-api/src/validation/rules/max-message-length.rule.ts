import { Injectable } from '@nestjs/common';
import { ValidationContext, ValidationResult, ValidationRule, Severity } from '../validation.models';

@Injectable()
export class MaxMessageLengthRule implements ValidationRule {
    id = 'input-length';
    name = 'Max Message Length';
    type: 'input' = 'input';

    private maxLength = 500; // configurable?

    evaluate(content: string, context: ValidationContext): ValidationResult {
        if (content.length > this.maxLength) {
            return {
                passed: false,
                ruleId: this.id,
                severity: 'block',
                message: `Message too long (${content.length}/${this.maxLength} chars).`,
            };
        }
        return { passed: true, ruleId: this.id, severity: 'info' };
    }
}
