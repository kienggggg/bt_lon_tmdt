// src/booking/booking.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Request() req, @Body() body: any) {
    return this.bookingService.createBooking(req.user.userId, body);
  }

  // --- API MỚI: Lấy danh sách vé ---
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyBookings(@Request() req) {
    return this.bookingService.getMyBookings(req.user.userId);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('send-email/:id') // :id là bookingId
  sendEmail(@Request() req, @Param('id') id: string) {
    return this.bookingService.sendTicketEmail(id, req.user.userId);
  }
  @UseGuards(JwtAuthGuard) // Có thể thêm RolesGuard nếu muốn chặt chẽ
  @Get('stats') // API sẽ là /api/v1/booking/stats
  getStats() {
    return this.bookingService.getDashboardStats();
  }
}
