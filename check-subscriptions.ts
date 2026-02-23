import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubscriptions() {
    console.log('--- Checking User Subscriptions ---');
    const users = await prisma.user.findMany({
        select: {
            email: true,
            subscriptionStatus: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
        }
    });

    console.table(users);
    await prisma.$disconnect();
}

checkSubscriptions().catch(console.error);
