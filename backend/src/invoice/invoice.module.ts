import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceService } from './invoice.service';
import { Invoice } from './entities/invoice.entity';
import { Booking } from '../booking/entities/booking.entity';
import { UserProfile } from '../users/entities/user-profile.entity';

@Module({
  imports: [
    // Đăng ký quyền truy cập vào 3 bảng này
    TypeOrmModule.forFeature([Invoice, Booking, UserProfile]) 
  ],
  providers: [InvoiceService],
  exports: [InvoiceService], 
})
export class InvoiceModule {}