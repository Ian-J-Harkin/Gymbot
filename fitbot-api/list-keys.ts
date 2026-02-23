import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllKeys() {
    try {
        const keys = await prisma.apiKey.findMany();
        console.log('--- All API Keys ---');
        console.log(JSON.stringify(keys, null, 2));
    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

listAllKeys();
