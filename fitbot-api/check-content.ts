import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocContent() {
    try {
        const doc = await prisma.document.findFirst({
            where: { fileName: 'Iron_Oasis_Handbook.pdf' }
        });
        console.log('--- Document Content ---');
        if (doc) {
            console.log('ID:', doc.id);
            console.log('Content Length:', doc.content.length);
            console.log('First 100 chars:', doc.content.substring(0, 100));
        } else {
            console.log('Document not found');
        }
    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDocContent();
