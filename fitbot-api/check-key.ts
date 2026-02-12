import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApiKey() {
    const keyMatch = 'bfa75a41d9f9d1288cc98974a624d19972233f313a';
    try {
        const apiKey = await prisma.apiKey.findFirst({
            where: { key: keyMatch }
        });
        console.log('--- API Key Search ---');
        if (apiKey) {
            console.log('Key found:', JSON.stringify(apiKey, null, 2));
        } else {
            console.log('Key NOT found in database.');
        }
    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkApiKey();
