import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình CORS "thoáng" nhất để test cho dễ
  app.enableCors({
    origin: '*', // Cho phép tất cả
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1'); 

  // Quan trọng: Lắng nghe trên 0.0.0.0
  // Nếu có biến PORT thì dùng, không thì dùng 3000
  await app.listen(process.env.PORT || 3000, '0.0.0.0'); 
  
  console.log(`Backend is running`); // Bỏ app.getUrl() đi cho đỡ hoang mang
}
bootstrap();