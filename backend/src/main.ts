import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Bật CORS (Để Frontend port 3000 gọi được Backend port 3001)
  app.enableCors({
    origin: '*', // Mở hết cho dễ
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1'); 

  // 👇 SỬA DÒNG NÀY (Thêm '0.0.0.0' vào cuối)
  await app.listen(process.env.PORT || 3001, '0.0.0.0'); 
  
  console.log(`Backend is running on: ${await app.getUrl()}`);
}
bootstrap();