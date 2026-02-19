import { ValidationRule, ValidationContext, ValidationResult, RuleType } from '../validation.models';

export class PromptInjectionRule implements ValidationRule {
    id = 'prompt-injection-guard';
    name = 'Prompt Injection Guard';
    type: RuleType = 'input';

    private suspiciousPhrases = [
        'ignore previous instructions',
        'ignore all previous instructions',
        'system prompt',
        'you are now',
        'act as a linux terminal',
    ];

    evaluate(content: string, context: ValidationContext): ValidationResult {
        const lowerContent = content.toLowerCase();
        const found = this.suspiciousPhrases.some(phrase => lowerContent.includes(phrase));

        if (found) {
            return {
                passed: false,
                ruleId: this.id,
                severity: 'block',
                message: "Message flagged as potential prompt injection."
            };
        }

        return {
            passed: true,
            ruleId: this.id,
            severity: 'info'
        };
    }
}
