import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Bật CORS (Để Frontend port 3000 gọi được Backend port 3001)
  app.enableCors();

  // 2. Cài đặt tiền tố toàn cục (Global Prefix)
  // Nếu thiếu dòng này, API sẽ là localhost:3001/auth/login -> LỖI 404 vì Frontend gọi api/v1/...
  app.setGlobalPrefix('api/v1'); 

  // 3. Đổi Port thành 3001 (để tránh đụng hàng với Next.js đang chạy ở 3000)
  await app.listen(3001); 
  console.log(`Backend is running on: http://localhost:3001/api/v1`);
}
bootstrap();