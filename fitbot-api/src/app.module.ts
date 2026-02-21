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
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
  providers: [AppService],
})
export class AppModule { }
