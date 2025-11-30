import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// backend/src/main.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1'); 

  // 👇 LOGIC CHUẨN:
  // process.env.PORT: Là cổng Railway tự cấp (ví dụ 6821).
  // 3000: Là cổng dự phòng khi chạy localhost.
  // '0.0.0.0': Bắt buộc để nghe từ bên ngoài.
  const port = process.env.PORT || 3000;
  
  await app.listen(port, '0.0.0.0'); 
  
  console.log(`Backend is running on port: ${port}`);
}
bootstrap();