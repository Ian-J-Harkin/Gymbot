import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocs() {
    try {
        const docs = await prisma.document.findMany({
            include: {
                _count: {
                    select: { chunks: true }
                }
            }
        });
        console.log('--- Current Documents ---');
        docs.forEach(doc => {
            console.log(`- ${doc.fileName} (ID: ${doc.id}, Chunks: ${doc._count.chunks})`);
        });
    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDocs();
