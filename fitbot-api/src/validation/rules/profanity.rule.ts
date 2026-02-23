import { ValidationRule, ValidationContext, ValidationResult, RuleType } from '../validation.models';

export class ProfanityRule implements ValidationRule {
    id = 'profanity-check';
    name = 'Profanity Filter';
    type: RuleType = 'input';

    private blacklistedWords = [
        'badword', 'offensive', 'hate', // Placeholder list. In production use a library or extensive list.
    ];

    evaluate(content: string, context: ValidationContext): ValidationResult {
        const lowerContent = content.toLowerCase();
        const found = this.blacklistedWords.some(word => lowerContent.includes(word));

        if (found) {
            return {
                passed: false,
                ruleId: this.id,
                severity: 'block',
                message: "Message contains inappropriate language."
            };
        }

        return {
            passed: true,
            ruleId: this.id,
            severity: 'info'
        };
    }
}
