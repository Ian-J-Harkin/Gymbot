const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    await prisma.user.updateMany({
        data: {
            subscriptionStatus: 'active'
        }
    });
    console.log('All users set to active for testing.');
    await prisma.$disconnect();
}

fix();
