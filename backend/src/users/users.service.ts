import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 1. Hàm tạo user mới (Dùng cho Register)
  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }

  // 2. Hàm tìm theo email (Dùng cho Login)
  async findOne(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'username',
        'password_hash',
        'role',
        'interests',
        'provider',
        'provider_id',
        'created_at',
        'updated_at',
      ],
    });
  }

  // 3. Hàm tìm theo ID (Dùng cho Booking)
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { id },
      relations: ['profile'] 
    });
  }

  // 4. Hàm cập nhật sở thích (Dùng cho Personalization)
  async updateInterests(userId: string, interests: string[]) {
    const user = await this.findById(userId);
    if (user) {
      user.interests = interests;
      return this.usersRepository.save(user);
    }
    return null;
  }
}