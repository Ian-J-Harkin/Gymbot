import { Test, TestingModule } from '@nestjs/testing';
import { RecaptchaService } from './recaptcha.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('RecaptchaService', () => {
    let service: RecaptchaService;
    let configService: Partial<ConfigService>;

    // Mock fetch global
    global.fetch = jest.fn();

    beforeEach(async () => {
        configService = {
            get: jest.fn((key: string) => {
                if (key === 'GOOGLE_RECAPTCHA_SECRET_KEY') return 'test-secret';
                return null;
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RecaptchaService,
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<RecaptchaService>(RecaptchaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('verify', () => {
        it('should return true if secret key is missing (dev mode bypass)', async () => {
            configService.get = jest.fn().mockReturnValue(null);
            // Re-init service to pick up new config
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    RecaptchaService,
                    { provide: ConfigService, useValue: configService },
                ],
            }).compile();
            const devService = module.get<RecaptchaService>(RecaptchaService);

            const result = await devService.verify('some-token');
            expect(result).toBe(true);
        });

        it('should return true if google verification succeeds', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: jest.fn().mockResolvedValue({ success: true }),
            });

            const result = await service.verify('valid-token');
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://www.google.com/recaptcha/api/siteverify',
                expect.objectContaining({
                    method: 'POST',
                    body: 'secret=test-secret&response=valid-token',
                })
            );
        });

        it('should return false if google verification fails', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                json: jest.fn().mockResolvedValue({ success: false, 'error-codes': ['invalid-input-response'] }),
            });

            const result = await service.verify('invalid-token');
            expect(result).toBe(false);
        });

        it('should throw BadRequestException on network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

            await expect(service.verify('token')).rejects.toThrow('reCAPTCHA verification failed');
        });
    });
});
