import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

jest.mock('stripe');

describe('StripeService', () => {
    let service: StripeService;
    let configService: Partial<ConfigService>;
    let prismaService: any;
    let mockStripeInstance: any;

    beforeEach(async () => {
        mockStripeInstance = {
            checkout: {
                sessions: {
                    create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
                },
            },
            billingPortal: {
                sessions: {
                    create: jest.fn(),
                },
            },
            webhooks: {
                constructEvent: jest.fn(),
            },
        };

        (Stripe as any).mockImplementation(() => mockStripeInstance);

        configService = {
            get: jest.fn((key: string) => {
                const config = {
                    STRIPE_SECRET_KEY: 'sk_test_123',
                    STRIPE_PRICE_ID: 'price_123',
                    STRIPE_RETURN_URL: 'http://localhost:3000/billing',
                    STRIPE_WEBHOOK_SECRET: 'whsec_123',
                };
                return config[key];
            }),
        };

        prismaService = {
            user: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StripeService,
                { provide: ConfigService, useValue: configService },
                { provide: PrismaService, useValue: prismaService },
            ],
        }).compile();

        service = module.get<StripeService>(StripeService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('isSubscriptionActive', () => {
        it('should return true if status is active', async () => {
            prismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'active' });
            const result = await service.isSubscriptionActive('user-1');
            expect(result).toBe(true);
        });

        it('should return false if status is not active', async () => {
            prismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'canceled' });
            const result = await service.isSubscriptionActive('user-1');
            expect(result).toBe(false);
        });
    });

    describe('createCheckoutSession', () => {
        it('should create a checkout session and return clientSecret', async () => {
            const userId = 'user-1';
            const email = 'test@example.com';

            mockStripeInstance.checkout.sessions.create.mockResolvedValue({
                client_secret: 'cs_test_secret',
            });

            const result = await service.createCheckoutSession(userId, email);

            expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    line_items: [{ price: 'price_123', quantity: 1 }],
                    mode: 'subscription',
                    customer_email: email,
                    client_reference_id: userId,
                }),
            );
            expect(result).toEqual({ clientSecret: 'cs_test_secret' });
        });
    });

    describe('when STRIPE_SECRET_KEY is not set', () => {
        let disabledService: StripeService;

        beforeEach(async () => {
            const disabledConfigService = {
                get: jest.fn((key: string) => {
                    if (key === 'STRIPE_SECRET_KEY') return undefined;
                    return 'some-value';
                }),
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    StripeService,
                    { provide: ConfigService, useValue: disabledConfigService },
                    { provide: PrismaService, useValue: prismaService },
                ],
            }).compile();

            disabledService = module.get<StripeService>(StripeService);
        });

        it('should throw ServiceUnavailableException from createCheckoutSession', async () => {
            await expect(
                disabledService.createCheckoutSession('user-1', 'test@test.com'),
            ).rejects.toThrow('Stripe integration is not configured');
        });

        it('should still allow isSubscriptionActive (DB-only method)', async () => {
            prismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'active' });
            const result = await disabledService.isSubscriptionActive('user-1');
            expect(result).toBe(true);
        });
    });

    describe('createPortalSession', () => {
        it('should create a billing portal session for a user with customer ID', async () => {
            const userId = 'user-1';
            prismaService.user.findUnique.mockResolvedValue({
                id: userId,
                stripeCustomerId: 'cus_123',
            });

            mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
                url: 'https://billing.stripe.com/p/session/test',
            });

            const result = await service.createPortalSession(userId);

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId },
                select: { stripeCustomerId: true },
            });
            expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
                customer: 'cus_123',
                return_url: 'http://localhost:3000/billing',
            });
            expect(result.url).toBe('https://billing.stripe.com/p/session/test');
        });

        it('should throw error if user does not have a stripe customer ID', async () => {
            prismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                stripeCustomerId: null,
            });

            await expect(service.createPortalSession('user-1')).rejects.toThrow(
                'User does not have a Stripe customer ID',
            );
        });

        it('should throw error if user not found', async () => {
            prismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.createPortalSession('user-1')).rejects.toThrow(
                'User not found',
            );
        });
    });

    describe('handleWebhook', () => {
        it('should process customer.subscription.created event', async () => {
            const signature = 'sig_123';
            const payload = Buffer.from('payload');
            const mockEvent = {
                type: 'customer.subscription.created',
                data: {
                    object: {
                        customer: 'cus_123',
                        status: 'active',
                        id: 'sub_123',
                        items: { data: [{ price: { id: 'price_123' } }] },
                    },
                },
            };

            mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);
            prismaService.user.findFirst.mockResolvedValue({ id: 'user-1' });

            await service.handleWebhook(signature, payload);

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: {
                    stripeSubscriptionId: 'sub_123',
                    subscriptionStatus: 'active',
                    subscriptionPriceId: 'price_123',
                },
            });
        });
    });
});
