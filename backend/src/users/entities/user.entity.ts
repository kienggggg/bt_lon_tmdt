// src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserProfile } from './user-profile.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ name: 'password_hash', select: false })
  password_hash: string;

  // --- THÊM CỘT NÀY ĐỂ SỬA LỖI ---
  @Column({ default: 'user' }) 
  role: string; // Trong DB là 'admin' | 'user' | 'organizer'
  // -------------------------------

  @Column('text', { array: true, nullable: true, default: () => 'ARRAY[]::text[]' })
  interests: string[];

  @Column({ nullable: true })
  provider: string;

  @Column({ name: 'provider_id', nullable: true })
  provider_id: string;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}