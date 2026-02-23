import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';


const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            password: 'hashedPassword123', // Doesn't matter for this test
            gymName: 'Test Gym',
        },
    });

    // Simple encryption to match the app's logic
    const encrypt = (text: string) => {
        const key = Buffer.from('thisis32charslongsecretkeyphrase');
        const iv = Buffer.from('thisis16charsiv!'); // Static for seed test
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    };

    const provider = process.env.AI_PROVIDER || 'openai';
    const ollamaUrl = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'mistral:7b';
    const rawOpenAiKey = process.env.OPENAI_API_KEY || 'sk-dummy-key-for-test';

    const config = await prisma.configuration.upsert({
        where: { userId: user.id },
        update: {
            aiProvider: provider,
            ollamaUrl: ollamaUrl,
            ollamaModel: ollamaModel,
            openAiApiKey: encrypt(rawOpenAiKey),
        },
        create: {
            userId: user.id,
            faqText: 'The midnight class is taught by Coach John.',
            widgetColor: '#2563EB',
            aiProvider: provider,
            ollamaUrl: ollamaUrl,
            ollamaModel: ollamaModel,
            openAiApiKey: encrypt(rawOpenAiKey),
        },
    });

    const apiKey = await prisma.apiKey.upsert({
        where: { key: 'demo-api-key-123' },
        update: { status: 'ACTIVE' },
        create: {
            key: 'demo-api-key-123',
            status: 'ACTIVE',
            configurationId: config.id,
        },
    });

    console.log('Seeded test data:');
    console.log(`User: ${user.email}`);
    console.log(`API Key: ${apiKey.key}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
