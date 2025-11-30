import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BookingItem } from './booking-item.entity'; // Import mới

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('numeric', { precision: 12, scale: 2 })
  total_amount: number;

  @Column()
  status: string; // PENDING, PAID

  @Column({ nullable: true })
  payment_gateway: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Quan hệ 1-Nhiều: Một đơn hàng có nhiều dòng chi tiết
  @OneToMany(() => BookingItem, (item) => item.booking, { cascade: true })
  items: BookingItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}