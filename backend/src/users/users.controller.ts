import { Controller, Get, UseGuards, Request, Put, Body } from '@nestjs/common'; // Đã thêm Body
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/interests')
  updateInterests(@Request() req, @Body() body: { interests: string[] }) {
    const userId = req.user.userId;
    const { interests } = body;
    return this.usersService.updateInterests(userId, interests);
  }
}