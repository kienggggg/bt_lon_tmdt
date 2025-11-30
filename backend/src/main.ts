import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Bật CORS (Để Frontend port 3000 gọi được Backend port 3001)
  app.enableCors({
    // Cho phép Frontend trên Vercel và Localhost gọi vào
    origin: [
      'http://localhost:3000', 
      'https://bt-lon-tmdt.vercel.app' // <-- Thay đúng link Vercel của bạn vào đây
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // --------------------

  app.setGlobalPrefix('api/v1'); 
  await app.listen(process.env.PORT || 3001, '0.0.0.0'); 
  console.log(`Backend is running on: ${await app.getUrl()}`);
}
bootstrap();