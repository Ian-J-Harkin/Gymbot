import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, id: true }
        });
        console.log('--- Current Users in Database ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('---------------------------------');
        console.log('DATABASE_URL:', process.env.DATABASE_URL);
    } catch (error) {
        console.error('Database connection error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
