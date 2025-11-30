import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Logic đơn giản: Nếu không phải admin hoặc organizer thì chặn
    if (user.role !== 'admin' && user.role !== 'organizer') {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }
    return true;
  }
}