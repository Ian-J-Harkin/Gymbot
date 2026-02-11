
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            throw new UnauthorizedException('Missing API Key');
        }

        const keyRecord = await this.prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: {
                configuration: {
                    include: { user: true }
                }
            },
        });

        if (!keyRecord || keyRecord.status !== 'ACTIVE') {
            throw new UnauthorizedException('Invalid API Key');
        }

        // Attach configuration to the request object for use in controllers
        request.configuration = keyRecord.configuration;
        return true;
    }
}
