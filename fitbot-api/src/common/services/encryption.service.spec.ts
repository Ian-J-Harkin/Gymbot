import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { ConfigService } from '@nestjs/config';

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EncryptionService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key) => {
                            if (key === 'ENCRYPTION_KEY') return '12345678901234567890123456789012';
                            if (key === 'IV_SECRET') return '1234567890123456';
                            return null;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should encrypt and decrypt a string correctly', () => {
        const originalText = 'my-secret-payload';
        const encrypted = service.encrypt(originalText);

        expect(encrypted).toContain(':');
        expect(encrypted.split(':')).toHaveLength(3);

        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(originalText);
    });

    it('should throw error for invalid format', () => {
        expect(() => service.decrypt('invalid-format')).toThrow('Invalid encrypted string format');
    });

    it('should result in different ciphertexts for same input (different IVs)', () => {
        const text = 'hello';
        const enc1 = service.encrypt(text);
        const enc2 = service.encrypt(text);
        expect(enc1).not.toBe(enc2);
    });
});
