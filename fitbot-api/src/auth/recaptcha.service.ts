import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaService {
    private readonly logger = new Logger(RecaptchaService.name);
    private readonly secretKey: string | undefined;

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('GOOGLE_RECAPTCHA_SECRET_KEY');
    }

    async verify(token: string): Promise<boolean> {
        if (!this.secretKey) {
            this.logger.warn('GOOGLE_RECAPTCHA_SECRET_KEY is not defined. Skipping verification.');
            return true; // Bypass in dev if not configured
        }

        try {
            const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${this.secretKey}&response=${token}`,
            });

            const data = await response.json();

            if (!data.success) {
                this.logger.error(`reCAPTCHA verification failed: ${JSON.stringify(data['error-codes'])}`);
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error(`Error during reCAPTCHA verification: ${error.message}`);
            throw new BadRequestException('reCAPTCHA verification failed');
        }
    }
}
