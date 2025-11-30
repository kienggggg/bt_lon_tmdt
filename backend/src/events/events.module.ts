import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- MỞ RA
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity'; // <-- MỞ RA

@Module({
  imports: [TypeOrmModule.forFeature([Event])], // <-- ĐĂNG KÝ ENTITY
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService], // Export để BookingModule dùng được
})
export class EventsModule {}