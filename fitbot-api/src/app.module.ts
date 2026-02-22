import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigurationsModule } from './configurations/configurations.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { WidgetModule } from './widget/widget.module';
import { StripeModule } from './stripe/stripe.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        ENCRYPTION_KEY: Joi.string().length(32).required(),
        IV_SECRET: Joi.string().length(16).required(),
        AI_PROVIDER: Joi.string().valid('openai', 'openrouter', 'ollama').default('openai'),
        PORT: Joi.number().default(3005),
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    UsersModule,
    AuthModule,
    PrismaModule,
    ConfigurationsModule,
    ApiKeysModule,
    WidgetModule,
    StripeModule,
    KnowledgeBaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
