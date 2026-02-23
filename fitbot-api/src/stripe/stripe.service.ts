import { Injectable, Logger, ServiceUnavailableException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
    private stripe: Stripe | null = null;
    private readonly logger = new Logger(StripeService.name);
    private readonly isEnabled: boolean;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
<<<<<<< HEAD
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (apiKey) {
            this.stripe = new Stripe(apiKey, {
                apiVersion: '2026-01-28.clover',
            });
        } else {
            this.logger.warn('STRIPE_SECRET_KEY not set. Billing features will be disabled or mocked.');
        }
=======
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            this.logger.warn('STRIPE_SECRET_KEY is not defined. Stripe integration will be disabled.');
            this.isEnabled = false;
        } else {
            this.stripe = new Stripe(stripeKey);
            this.isEnabled = true;
        }
    }

    /**
     * Returns the Stripe client or throws if Stripe is not configured.
     */
    private getStripeClient(): Stripe {
        if (!this.isEnabled || !this.stripe) {
            throw new ServiceUnavailableException('Stripe integration is not configured. Set STRIPE_SECRET_KEY to enable.');
        }
        return this.stripe;
>>>>>>> feat/kb-uploads-and-security
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
<<<<<<< HEAD
        if (!this.stripe) {
            this.logger.log('Mocking checkout session creation (No Stripe Key)');
            const returnUrl = this.configService.get<string>('STRIPE_RETURN_URL') || 'http://localhost:3001/dashboard';
            // Strip any query params from returnUrl for the base, then append mock param
            const baseUrl = returnUrl.split('?')[0];
            return { url: `${baseUrl}?session_id=mock_session_123&mock_success=true` };
        }

        const priceId = this.configService.get<string>('STRIPE_PRICE_ID');
        const returnUrl = this.configService.get<string>('STRIPE_RETURN_URL');
=======
        const stripe = this.getStripeClient();
        const priceId = this.configService.get<string>('STRIPE_PRICE_ID')!;
        const returnUrl = this.configService.get<string>('STRIPE_RETURN_URL')!;
>>>>>>> feat/kb-uploads-and-security

        try {
            const session = await stripe.checkout.sessions.create({
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
        const stripe = this.getStripeClient();
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.stripeCustomerId) {
            throw new BadRequestException('User does not have a Stripe customer ID');
        }

        const returnUrl = this.configService.get<string>('STRIPE_RETURN_URL')!;
        // Ensure portal returns to our dedicated bridge page that closes the popup
        const portalReturnUrl = returnUrl.replace('/billing/success', '/billing/portal-return');

        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: portalReturnUrl,
            });
            return { url: session.url };
        } catch (err) {
            this.logger.error(`Stripe Portal Session Creation Failed: ${err.message}`);
            throw err;
        }
    }

    async handleWebhook(signature: string, payload: Buffer) {
<<<<<<< HEAD
        if (!this.stripe) {
            this.logger.warn('Received webhook but Stripe is not configured.');
            return;
        }

        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
=======
        const stripe = this.getStripeClient();
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!;
>>>>>>> feat/kb-uploads-and-security
        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
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
                    const invoice = event.data.object as any;
                    if (invoice.subscription) {
                        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
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

        if (session.subscription) {
            const stripe = this.getStripeClient();
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            await this.updateSubscriptionStatus(subscription);
        }
    }

    private async updateSubscriptionStatus(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const status = subscription.status;

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

