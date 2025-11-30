import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TicketType } from './ticket-type.entity';

@Entity({ name: 'events' })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  slug: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: false })
  is_online: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({ type: 'jsonb', nullable: true })
  speakers: any; 

  @Column({ type: 'jsonb', nullable: true })
  agenda: any;

  @OneToMany(() => TicketType, (ticket) => ticket.event)
  ticket_types: TicketType[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}