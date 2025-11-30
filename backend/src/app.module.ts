// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

// --- IMPORT CÁC MODULE CON ---
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';       // <-- QUAN TRỌNG: Phải có AuthModule
import { EventsModule } from './events/events.module'; // <-- QUAN TRỌNG: Phải có EventsModule
import { BookingModule } from './booking/booking.module';
import { InvoiceModule } from './invoice/invoice.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Để đọc file .env
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true cho port 465, false cho các port khác
        auth: {
          user: 'kienprovip1257@gmail.com', // <-- SỬA EMAIL CỦA BẠN
          pass: 'syph grcf mwzm mezp', // <-- SỬA APP PASSWORD VỪA LẤY
        },
      },
      defaults: {
        from: '"EventPass Support" <no-reply@eventpass.com>',
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      
      // Tự động load các file entity có đuôi .entity.ts
      autoLoadEntities: true, 
      
      // QUAN TRỌNG: Đặt là false vì bạn đã có file SQL chuẩn
      synchronize: false, 
    }),
    UsersModule,
    AuthModule,     // <-- NẾU THIẾU DÒNG NÀY SẼ BỊ 404 /auth/login
    EventsModule,   // <-- NẾU THIẾU DÒNG NÀY SẼ BỊ 404 /events
    BookingModule,
    InvoiceModule
  ],
})
export class AppModule {}