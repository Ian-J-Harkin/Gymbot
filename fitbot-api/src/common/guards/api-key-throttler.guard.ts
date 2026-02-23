import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        // If an API key configuration is present on the request, track by the key.
        // This assumes the ApiKeyAuthGuard has already run and attached the config.
        if (req.configuration?.apiKey?.key) {
            return req.configuration.apiKey.key;
        }

        // Fall back to IP-based tracking if no API key is found
        return req.ips?.length ? req.ips[0] : req.ip;
    }
}
