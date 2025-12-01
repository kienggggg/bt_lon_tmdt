import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { InvoiceService } from '../invoice/invoice.service';
import { TicketType } from '../events/entities/ticket-type.entity';
import { Booking } from './entities/booking.entity';
import { BookingItem } from './entities/booking-item.entity';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class BookingService {
  constructor(
    private usersService: UsersService,
    private invoiceService: InvoiceService,
    private dataSource: DataSource,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private readonly mailerService: MailerService,
  ) {}

  // 1. Logic Mua vé (Transaction 2 bảng)
  async createBooking(userId: string, createBookingDto: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersService.findById(userId);
      if (!user) throw new NotFoundException('User not found');
      
      // Tìm loại vé
      const ticketType = await queryRunner.manager.findOne(TicketType, {
        where: { id: createBookingDto.ticketTypeId },
        //relations: ['event'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!ticketType) throw new NotFoundException('Vé không tồn tại');

      const quantity = createBookingDto.quantity || 1;
      if (ticketType.remaining_quantity < quantity) {
        throw new BadRequestException('Vé này đã hết!');
      }

      // Trừ tồn kho
      ticketType.remaining_quantity -= quantity;
      await queryRunner.manager.save(ticketType);

      const totalPrice = Number(ticketType.price) * quantity;

      // Tạo Booking (Header)
      const booking = new Booking();
      booking.user = user;
      booking.total_amount = totalPrice;
      booking.status = 'PAID'; // Giả lập đã thanh toán luôn cho nhanh
      booking.payment_gateway = 'MOMO';

      // Tạo Booking Item (Detail)
      const bookingItem = new BookingItem();
      bookingItem.ticket_type = ticketType;
      bookingItem.quantity = quantity;
      bookingItem.price = Number(ticketType.price);
      
      // Gán item vào booking để lưu cascade
      booking.items = [bookingItem];

      // Lưu tất cả
      const savedBooking = await queryRunner.manager.save(booking);

      await queryRunner.commitTransaction();

      // Xử lý Invoice (Nếu có)
      if (createBookingDto.request_vat === true) {
        this.invoiceService.createInvoiceRequest(savedBooking.id, userId);
      }

      return {
        status: 'success',
        booking_id: savedBooking.id,
        payment_url: `https://bt-lon-tmdt.vercel.app/user/my-tickets`, // Chuyển hướng về trang vé
      };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // 2. Logic Lấy vé của tôi (Get My Bookings)
  async getMyBookings(userId: string) {
    return this.bookingRepo.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.ticket_type', 'items.ticket_type.event'], // Join để lấy tên sự kiện
      order: { created_at: 'DESC' }
    });
  }
  
  async sendTicketEmail(bookingId: string, userId: string) {
    // 1. Lấy thông tin booking kèm theo thông tin vé và sự kiện
    const booking = await this.bookingRepo.findOne({
        where: { id: bookingId },
        relations: ['user', 'items', 'items.ticket_type', 'items.ticket_type.event']
    });

    if (!booking) throw new NotFoundException("Đơn hàng không tồn tại");
    
    // 2. Kiểm tra quyền (chỉ gửi cho chính chủ)
    if (booking.user.id !== userId) throw new BadRequestException("Bạn không có quyền thao tác trên vé này");

    const eventName = booking.items[0]?.ticket_type.event.title || 'Sự kiện';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${booking.id}`;

    // 3. Gửi email
    try {
      await this.mailerService.sendMail({
        to: booking.user.email, // Gửi đến email của user
        subject: `[EventPass] Vé điện tử: ${eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0;">VÉ SỰ KIỆN CỦA BẠN</h1>
            </div>
            <div style="padding: 20px;">
              <p>Xin chào <strong>${booking.user.email}</strong>,</p>
              <p>Cảm ơn bạn đã đặt vé tại EventPass. Dưới đây là thông tin vé của bạn:</p>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #111827; margin-top: 0;">${eventName}</h2>
                <p style="margin: 5px 0;"><strong>Mã đơn:</strong> #${booking.id.slice(0, 8).toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Tổng tiền:</strong> ${Number(booking.total_amount).toLocaleString()} đ</p>
                <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="color: green; font-weight: bold;">ĐÃ THANH TOÁN</span></p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p>Quét mã này tại quầy check-in:</p>
                <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; padding: 10px; border-radius: 8px;" />
              </div>

              <p style="color: #6b7280; font-size: 12px; text-align: center;">Đây là email tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        `,
      });
      return { success: true, message: 'Đã gửi vé về email thành công!' };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Lỗi khi gửi email: ' + error.message);
    }
  }
  async getDashboardStats() {
    // 1. Tổng doanh thu (Chỉ tính đơn PAID)
    const revenue = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('SUM(booking.total_amount)', 'total')
      .where('booking.status = :status', { status: 'PAID' })
      .getRawOne();

    // 2. Tổng số vé đã bán
    const tickets = await this.dataSource
      .getRepository(BookingItem)
      .createQueryBuilder('item')
      .select('SUM(item.quantity)', 'total')
      .leftJoin('item.booking', 'booking')
      .where('booking.status = :status', { status: 'PAID' })
      .getRawOne();

    // 3. Lấy 5 đơn hàng mới nhất
    const recentBookings = await this.bookingRepo.find({
      order: { created_at: 'DESC' },
      take: 5,
      relations: ['user', 'items', 'items.ticket_type', 'items.ticket_type.event'],
    });

    return {
      totalRevenue: revenue.total ? Number(revenue.total) : 0,
      totalTickets: tickets.total ? Number(tickets.total) : 0,
      recentBookings,
    };
  }
}
