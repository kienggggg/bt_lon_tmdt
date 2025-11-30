// src/auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: any) {
    // 1. Kiểm tra Email đã tồn tại chưa
    const existingUser = await this.usersService.findOne(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại!');
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 3. --- QUAN TRỌNG: MAP DỮ LIỆU TỪ FRONTEND SANG DATABASE ---
    // Frontend gửi: "student", "professional", "organizer"
    // Database chỉ nhận: "user", "organizer"
    
    let dbRole = 'user'; // Mặc định coi sinh viên/chuyên gia là 'user' thường

    if (createUserDto.user_type === 'organizer') {
      dbRole = 'organizer'; // Nếu chọn Người tổ chức thì giữ nguyên
    }

    // 4. Lưu vào Database với role đã được chuẩn hóa
    const newUser = await this.usersService.create({
      email: createUserDto.email,
      password_hash: hashedPassword,
      role: dbRole, // <--- LƯU Ý: Dùng biến dbRole, KHÔNG dùng createUserDto.user_type
      interests: [], // Mảng rỗng mặc định
      provider: 'local',
    });

    // 5. Trả về Token để tự động đăng nhập luôn
    return {
      message: 'Đăng ký thành công',
      access_token: this.jwtService.sign({ 
        email: newUser.email, 
        sub: newUser.id, 
        role: newUser.role 
      }),
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && user.password_hash && await bcrypt.compare(password, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}