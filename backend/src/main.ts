import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Bật CORS (Để Frontend port 3000 gọi được Backend port 3001)
  app.enableCors({
    // Thay vì liệt kê link, để 'true' nghĩa là:
    // "Ai gọi tôi cũng trả lời, và tôi tự động copy nguồn của họ vào header cho phép"
    origin: '*', // Cho phép TẤT CẢ mọi nơi gọi vào (Không cần credentials nữa)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    //credentials: true,
  });
  // --------------------

  app.setGlobalPrefix('api/v1'); 
  await app.listen(process.env.PORT || 3001, '0.0.0.0'); 
  console.log(`Backend is running on: ${await app.getUrl()}`);
}
bootstrap();