import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_profiles' })
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  user_id: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ name: 'phone', nullable: true })
  phone: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ name: 'birth_year', type: 'int', nullable: true })
  birth_year: number;

  // --- THÔNG TIN XUẤT HÓA ĐƠN (VAT INFO) ---
  @Column({ nullable: true })
  tax_code: string; // Mã số thuế

  @Column({ nullable: true })
  company_name: string; // Tên công ty

  @Column({ name: 'address', nullable: true })
  address: string; // Địa chỉ công ty
  // ------------------------------------------

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // <-- BẮT BUỘC PHẢI CÓ DÒNG NÀY
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}