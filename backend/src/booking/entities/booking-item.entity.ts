import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { TicketType } from '../../events/entities/ticket-type.entity';

@Entity({ name: 'booking_items' })
export class BookingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  quantity: number;

  @Column('numeric', { precision: 12, scale: 2 })
  price: number; // Giá tại thời điểm mua

  // Liên kết ngược về Booking cha
  @ManyToOne(() => Booking, (booking) => booking.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  // Liên kết với loại vé
  @ManyToOne(() => TicketType)
  @JoinColumn({ name: 'ticket_type_id' })
  ticket_type: TicketType;
}

