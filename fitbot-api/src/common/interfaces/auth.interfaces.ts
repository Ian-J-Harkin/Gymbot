import { Request } from 'express';
import { Configuration, User } from '@prisma/client';

export interface JwtPayload {
    email: string;
    sub: string;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    gymName: string | null;
    subscriptionStatus: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
}

export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

export interface ApiKeyRequest extends Request {
    configuration: Configuration & { user: User };
}
