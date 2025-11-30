// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: Record<string, any>) {
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async signUp(@Body() signUpDto: Record<string, any>) {
    // Thêm validation DTO sau
    return this.authService.register(signUpDto);
  }
}