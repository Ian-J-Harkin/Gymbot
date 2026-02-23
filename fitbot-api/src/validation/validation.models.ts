import { Configuration } from '@prisma/client';

export interface ValidationContext {
    configuration: Configuration;
    userMessage: string;
}

export type Severity = 'info' | 'warning' | 'block';
export type RuleType = 'input' | 'output';

export interface ValidationRule {
    id: string;
    name: string;
    type: RuleType;
    evaluate(content: string, context: ValidationContext): Promise<ValidationResult> | ValidationResult;
}

export interface ValidationResult {
    passed: boolean;
    ruleId: string;
    message?: string;
    severity: Severity;
}

export interface ValidationReport {
    results: ValidationResult[];
    hasBlockingError: boolean;
    blockingMessage?: string;
}
