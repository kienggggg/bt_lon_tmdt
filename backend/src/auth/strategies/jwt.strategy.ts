// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  // Sau khi token được xác thực, payload sẽ được gửi vào hàm này
  async validate(payload: any) {
    // Chúng ta có thể thêm logic lấy user từ DB ở đây
    // Trả về
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}