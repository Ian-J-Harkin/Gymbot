import { Injectable, Logger } from '@nestjs/common';
import { ValidationRule, ValidationContext, ValidationResult, ValidationReport } from './validation.models';

@Injectable()
export class ValidationService {
    private logger = new Logger(ValidationService.name);
    private rules: ValidationRule[] = [];

    registerRule(rule: ValidationRule) {
        this.logger.log(`Registering rule: ${rule.name} (${rule.type})`);
        this.rules.push(rule);
    }

    async validate(
        type: 'input' | 'output',
        content: string,
        context: ValidationContext,
    ): Promise<ValidationReport> {
        const applicableRules = this.rules.filter((r) => r.type === type);
        const results: ValidationResult[] = [];
        let hasBlockingError = false;
        let blockingMessage: string | undefined;

        for (const rule of applicableRules) {
            try {
                const result = await rule.evaluate(content, context);
                if (!result.passed) {
                    results.push(result);
                    if (result.severity === 'block') {
                        hasBlockingError = true;
                        blockingMessage = result.message;
                        // Should we stop on first blocking error? 
                        // For comprehensive logging, maybe not, but for perf maybe.
                        // Let's continue to gather all feedback.
                    }
                }
            } catch (error) {
                this.logger.error(`Error executing rule ${rule.name}:`, error);
                // Treat rule failure as non-blocking warning for now to avoid breaking chat flow
                results.push({
                    passed: false,
                    ruleId: rule.id,
                    severity: 'warning',
                    message: `Rule execution failed: ${error.message}`,
                });
            }
        }

        return {
            results,
            hasBlockingError,
            blockingMessage,
        };
    }
}
