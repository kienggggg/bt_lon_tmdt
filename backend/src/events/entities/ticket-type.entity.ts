import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity({ name: 'ticket_types' }) // Khớp tên bảng SQL
export class TicketType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // VD: Early Bird

  @Column('numeric', { precision: 12, scale: 2 }) // SQL dùng NUMERIC(12,2)
  price: number;

  @Column('int')
  initial_quantity: number;

  @Column('int')
  remaining_quantity: number;

  @ManyToOne(() => Event, (event) => event.ticket_types)
  @JoinColumn({ name: 'event_id' }) // Khóa ngoại trong SQL
  event: Event;
}