import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Booking } from '../../booking/entities/booking.entity';

@Entity({ name: 'invoices' })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoice_code: string; // Mã hóa đơn từ hệ thống bên thứ 3 (MISA/Viettel) trả về

  @Column()
  amount: number;

  // Lưu snapshot thông tin tại thời điểm xuất (đề phòng User đổi profile sau này)
  @Column()
  tax_code: string; 

  @Column()
  company_name: string;

  @Column()
  company_address: string;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'SUCCESS' | 'FAILED';

  @Column({ nullable: true })
  pdf_url: string; // Link tải hóa đơn PDF

  @OneToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @CreateDateColumn()
  created_at: Date;
}