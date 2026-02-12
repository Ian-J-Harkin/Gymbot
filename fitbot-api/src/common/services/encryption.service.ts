
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;
    private readonly ivSecret: Buffer;

    constructor(private configService: ConfigService) {
        const key = this.configService.get<string>('ENCRYPTION_KEY');
        const iv = this.configService.get<string>('IV_SECRET');

        if (!key || key.length !== 32) {
            throw new Error('ENCRYPTION_KEY must be a 32-character string');
        }
        if (!iv || iv.length !== 16) {
            throw new Error('IV_SECRET must be a 16-character string');
        }

        this.key = Buffer.from(key);
        this.ivSecret = Buffer.from(iv);
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        // Return IV + AuthTag + EncryptedText
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    decrypt(hash: string): string {
        const parts = hash.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted string format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
