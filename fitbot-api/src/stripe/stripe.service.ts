import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
    private stripe: Stripe;
    private readonly logger = new Logger(StripeService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            this.logger.warn('STRIPE_SECRET_KEY is not defined. Stripe integration will be disabled.');
        }

        this.stripe = new Stripe(stripeKey || 'mock_key');
    }

    async isSubscriptionActive(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { subscriptionStatus: true },
        });

        return user?.subscriptionStatus === 'active';
    }

    async createCheckoutSession(userId: string, email: string) {
        const priceId = this.configService.get<string>('STRIPE_PRICE_ID')!;
        const returnUrl = this.configService.get<string>('STRIPE_RETURN_URL')!;

        try {
            const session = await this.stripe.checkout.sessions.create({
                ui_mode: 'embedded',
                line_items: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                return_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
                customer_email: email,
                client_reference_id: userId,
            });
            return { clientSecret: session.client_secret };
        } catch (err) {
            this.logger.error(`Stripe Session Creation Failed: ${err.message}`);
            throw err;
        }
    }

    async createPortalSession(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.stripeCustomerId) {
            throw new Error('User does not have a Stripe customer ID');
        }

        const returnUrl = this.configService.get<string>('STRIPE_RETURN_URL')!;
        // Ensure portal returns to our dedicated bridge page that closes the popup
        const portalReturnUrl = returnUrl.replace('/billing/success', '/billing/portal-return');

        try {
            // NOTE: Embedded Portal requires ui_mode toggle
            const session = await this.stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: portalReturnUrl,
            });
            // For Portal, we still use the URL but we will render it in an IFRAME-like component
            // Or use the recently released Embedded Portal if the SDK version allows.
            // If the user wants a MODAL we can use an Iframe if we use the specific Portal session URL.
            // Stripe generally allows the Portal to be in an Iframe if configured.
            return { url: session.url };
        } catch (err) {
            this.logger.error(`Stripe Portal Session Creation Failed: ${err.message}`);
            throw err;
        }
    }

    async handleWebhook(signature: string, payload: Buffer) {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!;
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                this.logger.log(`Processing checkout.session.completed for ${session.id}`);
                await this.handleCheckoutSessionCompleted(session);
                break;
            case 'invoice.payment_succeeded':
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                this.logger.log(`Processing subscription event: ${event.type}`);
                if (event.type === 'invoice.payment_succeeded') {
                    const invoice = event.data.object as any; // Cast to any to avoid lint error on 'subscription'
                    if (invoice.subscription) {
                        const sub = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
                        await this.updateSubscriptionStatus(sub);
                    }
                } else {
                    const subscription = event.data.object as Stripe.Subscription;
                    await this.updateSubscriptionStatus(subscription);
                }
                break;
            default:
                this.logger.log(`Unhandled event type ${event.type}`);
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        const userId = session.client_reference_id;
        const customerId = session.customer as string;

        if (!userId) {
            this.logger.error('No userId found in checkout session client_reference_id');
            return;
        }

        this.logger.log(`Checkout completed for user ${userId} with customer ${customerId}`);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                stripeCustomerId: customerId,
            },
        });

        // The subscription status will be updated by the customer.subscription.created event
        // or we can fetch the subscription here if it exists in the session.
        if (session.subscription) {
            const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
            await this.updateSubscriptionStatus(subscription);
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
