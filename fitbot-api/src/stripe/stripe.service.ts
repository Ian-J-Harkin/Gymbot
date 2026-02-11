import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
    private stripe: Stripe | null = null;
    private readonly logger = new Logger(StripeService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (apiKey) {
            this.stripe = new Stripe(apiKey, {
                apiVersion: '2026-01-28.clover',
            });
        } else {
            this.logger.warn('STRIPE_SECRET_KEY not set. Billing features will be disabled or mocked.');
        }
    }

    async isSubscriptionActive(userId: string): Promise<boolean> {
        // Validation bypass for dev/test without Stripe
        if (!this.stripe) {
            return true; // Assume active in dev mode!
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionStatus: true },
        });

        return user?.subscriptionStatus === 'active';
    }

    async createCheckoutSession(userId: string, email: string) {
        if (!this.stripe) {
            this.logger.log('Mocking checkout session creation (No Stripe Key)');
            const returnUrl = this.configService.get<string>('STRIPE_RETURN_URL') || 'http://localhost:3001/dashboard';
            // Strip any query params from returnUrl for the base, then append mock param
            const baseUrl = returnUrl.split('?')[0];
            return { url: `${baseUrl}?session_id=mock_session_123&mock_success=true` };
        }

        const priceId = this.configService.get<string>('STRIPE_PRICE_ID');
        const returnUrl = this.configService.get<string>('STRIPE_RETURN_URL');

        return this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: returnUrl,
            customer_email: email,
            client_reference_id: userId,
        });
    }

    async handleWebhook(signature: string, payload: Buffer) {
        if (!this.stripe) {
            this.logger.warn('Received webhook but Stripe is not configured.');
            return;
        }

        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object as Stripe.Subscription;
                await this.updateSubscriptionStatus(subscription);
                break;
            default:
                this.logger.log(`Unhandled event type ${event.type}`);
        }
    }

    private async updateSubscriptionStatus(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const status = subscription.status;

        // Find user by stripe customer ID
        // Note: In a real implementation, you'd match by customer ID or client_reference_id during checkout
        const user = await this.prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (user) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    stripeSubscriptionId: subscription.id,
                    subscriptionStatus: status,
                    subscriptionPriceId: subscription.items.data[0]?.price.id,
                },
            });
        }
    }
}
