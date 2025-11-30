import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Booking } from '../booking/entities/booking.entity';
import { UserProfile } from '../users/entities/user-profile.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async createInvoiceRequest(bookingId: string, userId: string) {
    // 1. Lấy thông tin Booking
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // 2. Lấy thông tin VAT từ User Profile
    const profile = await this.userProfileRepository.findOne({ 
      where: { user: { id: userId } },
      relations: ['user'] 
    });

    if (!profile || !profile.tax_code) {
      // Nếu user chưa điền MST -> Báo lỗi hoặc lưu Log để nhắc nhở
      console.warn(`User ${userId} requested VAT but has no Tax Code info.`);
      return; 
    }

    // 3. Tạo record Invoice (Trạng thái PENDING)
    const newInvoice = this.invoiceRepository.create({
      booking: booking,
      amount: booking.total_amount,
      tax_code: profile.tax_code,
      company_name: profile.company_name,
      company_address: profile.address,
      invoice_code: `TEMP-${Date.now()}`, // Mã tạm
      status: 'PENDING',
    });
    await this.invoiceRepository.save(newInvoice);

    // 4. GỌI BÊN THỨ 3 (Giả lập Async)
    // Trong thực tế, bạn sẽ dùng axios.post('https://api.misa.vn/...')
    this.mockThirdPartyInvoiceProvider(newInvoice).then(async (result) => {
      if (result.success) {
        newInvoice.status = 'SUCCESS';
        newInvoice.invoice_code = result.eInvoiceCode;
        newInvoice.pdf_url = result.pdfUrl;
      } else {
        newInvoice.status = 'FAILED';
      }
      await this.invoiceRepository.save(newInvoice);
      console.log(`Invoice Processed: ${newInvoice.status}`);
    });

    return { message: 'Invoice request received', invoice_id: newInvoice.id };
  }

  // --- HÀM GIẢ LẬP GỌI API BÊN THỨ 3 ---
  private async mockThirdPartyInvoiceProvider(invoice: Invoice) {
    console.log('Connecting to E-Invoice Provider...');
    // Giả lập độ trễ mạng 2 giây
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Giả lập thành công 90%
    const isSuccess = Math.random() > 0.1; 
    
    if (isSuccess) {
      return {
        success: true,
        eInvoiceCode: `INV-${Math.floor(Math.random() * 100000)}`,
        pdfUrl: `https://einvoice-provider.com/download/${invoice.id}.pdf`
      };
    } else {
      return { success: false };
    }
  }
}