import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';
import { MaxMessageLengthRule } from './rules/max-message-length.rule';

describe('ValidationService', () => {
    let service: ValidationService;
    let lengthRule: MaxMessageLengthRule;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ValidationService, MaxMessageLengthRule],
        }).compile();

        service = module.get<ValidationService>(ValidationService);
        lengthRule = module.get<MaxMessageLengthRule>(MaxMessageLengthRule);

        service.registerRule(lengthRule);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should pass validation if input is short enough', async () => {
        const result = await service.validate('input', 'hello', {} as any);
        expect(result.hasBlockingError).toBe(false);
        expect(result.results).toHaveLength(0);
    });

    it('should fail validation if input is too long', async () => {
        const longMessage = 'a'.repeat(501);
        const result = await service.validate('input', longMessage, {} as any);
        expect(result.hasBlockingError).toBe(true);
        expect(result.blockingMessage).toContain('Message too long');
        expect(result.results[0].ruleId).toBe('input-length');
    });

    it('should only apply input rules to input content', async () => {
        const longMessage = 'a'.repeat(501);
        // lengthRule is registered for 'input'
        const result = await service.validate('output', longMessage, {} as any);
        expect(result.hasBlockingError).toBe(false);
    });
});
