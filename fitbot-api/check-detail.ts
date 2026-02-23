import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocContentDetail() {
    try {
        const doc = await prisma.document.findFirst({
            where: { fileName: 'Iron_Oasis_Handbook.pdf' }
        });
        if (doc) {
            console.log('Hex representation of content:');
            console.log(Buffer.from(doc.content).toString('hex'));
            console.log('Direct content:', JSON.stringify(doc.content));
        }
    } finally {
        await prisma.$disconnect();
    }
}

checkDocContentDetail();
