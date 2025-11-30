// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // Nếu có
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]) // <-- QUAN TRỌNG: Đăng ký Entity
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Export để BookingModule dùng được
})
export class UsersModule {}