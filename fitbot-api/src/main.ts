import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Restricted CORS - For MVP we allow all but this should be 
  // narrowed down to admin dashboard and the widget origins in production.
  // Restricted CORS - Whitelist the admin dashboard and allow widget origins
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite default local port (Admin Dashboard)
      'http://localhost:3001', // Local testing widget origin
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
