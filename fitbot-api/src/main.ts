import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Trust the reverse proxy (e.g., Render, Azure) so Rate Limiting uses the real client IP, not the load balancer IP.
  app.set('trust proxy', 1);

  if (isProduction) {
    app.useLogger(console); // Render aggregates stdout into structured logs
  }
  app.setGlobalPrefix('api');

  // Security headers
  app.use(helmet());

  // CORS — read allowed origins from env, fall back to dev defaults, and always allow vercel previews
  const allowedOriginsString = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsString
    ? allowedOriginsString.split(',').map((o) => o.trim())
    : [
      'http://localhost:5173',
      'http://localhost:3001',
      'https://gymbot-admin.vercel.app',
      'https://gymbot-react-demo.vercel.app'
    ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow any vercel deployment for testing ease
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();

