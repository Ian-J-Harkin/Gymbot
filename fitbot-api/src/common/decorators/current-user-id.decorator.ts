import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the current authenticated user's ID from the request.
 * Handles both `req.user.id` and `req.user.userId` shapes.
 *
 * Usage:
 *   @Get()
 *   async getConfig(@CurrentUserId() userId: string) { ... }
 */
export const CurrentUserId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return user?.id || user?.userId;
    },
);
