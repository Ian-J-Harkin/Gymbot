import { Controller, Post, Body, Headers, Req, Res, HttpStatus, UseGuards, RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';

@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create-checkout-session')
    async createCheckoutSession(@Req() req: any) {
        // req.user is populated by JwtAuthGuard
        // We handle both 'id' (new strategy) and 'userId' (old strategy) for robustness
        const userId = req.user.id || req.user.userId;
        const email = req.user.email;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const session = await this.stripeService.createCheckoutSession(userId, email);
        return session; // returns { clientSecret: '...' }
    }

    @UseGuards(JwtAuthGuard)
    @Post('create-portal-session')
    async createPortalSession(@Req() req: any) {
        const userId = req.user.id || req.user.userId;

        if (!userId) {
            throw new Error('User ID not found in request');
        }

        const session = await this.stripeService.createPortalSession(userId);
        return { url: session.url };
    }

    @Post('webhook')
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
    ) {
        if (!signature) {
            return res.status(HttpStatus.BAD_REQUEST).send('Missing stripe-signature');
        }

        if (!req.rawBody) {
            return res.status(HttpStatus.BAD_REQUEST).send('Missing raw body');
        }

        try {
            // We need the raw body for Stripe webhook verification
            await this.stripeService.handleWebhook(signature, req.rawBody);
            return res.status(HttpStatus.OK).send({ received: true });
        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
        }
    }
}
