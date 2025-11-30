// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule, // Thêm vào đây
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' }, // Token hết hạn sau 1 ngày
    }),
  ],
  providers: [AuthService, JwtStrategy], // Thêm JwtStrategy
  controllers: [AuthController],
})
export class AuthModule {}