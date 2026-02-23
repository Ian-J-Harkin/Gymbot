import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { HttpStatus } from '@nestjs/common';

describe('StripeController', () => {
    let controller: StripeController;
    let service: Partial<StripeService>;

    beforeEach(async () => {
        service = {
            createCheckoutSession: jest.fn().mockResolvedValue({ url: 'https://stripe.com/checkout' }),
            createPortalSession: jest.fn(),
            handleWebhook: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [StripeController],
            providers: [
                { provide: StripeService, useValue: service },
            ],
        }).compile();

        controller = module.get<StripeController>(StripeController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createCheckoutSession', () => {
        it('should return checkout session url', async () => {
            const req = {
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    gymName: null,
                    subscriptionStatus: null,
                    stripeCustomerId: null,
                    stripeSubscriptionId: null
                }
            } as any;
            const result = await controller.createCheckoutSession('user-1', req);
            expect(result).toEqual({ url: 'https://stripe.com/checkout' });
            expect(service.createCheckoutSession).toHaveBeenCalledWith('user-1', 'test@example.com');
        });
    });

    describe('createPortalSession', () => {
        it('should return billing portal session url', async () => {
            const req = { user: { id: 'user-1' } };
            (service.createPortalSession as jest.Mock).mockResolvedValue({ url: 'https://stripe.com/portal' });

            const result = await controller.createPortalSession('user-1');

            expect(result).toEqual({ url: 'https://stripe.com/portal' });
            expect(service.createPortalSession).toHaveBeenCalledWith('user-1');
        });
    });

    describe('handleWebhook', () => {
        it('should return 200 OK on successful webhook processing', async () => {
            const signature = 'sig_123';
            const req = { rawBody: Buffer.from('payload') } as any;
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as any;

            await controller.handleWebhook(signature, req, res);

            expect(service.handleWebhook).toHaveBeenCalledWith(signature, req.rawBody);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
            expect(res.send).toHaveBeenCalledWith({ received: true });
        });

        it('should return 400 Bad Request if signature is missing', async () => {
            const req = {} as any;
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as any;

            await controller.handleWebhook('', req, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
            expect(res.send).toHaveBeenCalledWith('Missing stripe-signature');
        });

        it('should return 400 Bad Request if rawBody is missing', async () => {
            const signature = 'sig_123';
            const req = {} as any;
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as any;

            await controller.handleWebhook(signature, req, res);

            expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
            expect(res.send).toHaveBeenCalledWith('Missing raw body');
        });
    });
});
