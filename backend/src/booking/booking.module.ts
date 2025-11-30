import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { UsersModule } from '../users/users.module';
import { InvoiceModule } from '../invoice/invoice.module';
// --- IMPORT CÁC ENTITY ---
import { Booking } from './entities/booking.entity';
import { BookingItem } from './entities/booking-item.entity'; // <-- QUAN TRỌNG
import { TicketType } from '../events/entities/ticket-type.entity';

@Module({
  imports: [
    // Phải liệt kê đủ 3 cái này thì Service mới chạy được
    TypeOrmModule.forFeature([Booking, BookingItem, TicketType]), 
    UsersModule,
    InvoiceModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}