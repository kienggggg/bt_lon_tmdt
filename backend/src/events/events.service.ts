// src/events/events.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThanOrEqual, LessThanOrEqual } from 'typeorm'; // Import thêm ILike
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  // --- SỬA HÀM TÌM KIẾM (Fix lỗi Search không ra) ---
  async findAll(query: any) {
    const { q, location, is_online, start_date } = query;
    
    const whereCondition: any = {};

    // 1. Tìm kiếm theo Tên (Dùng ILike để không phân biệt hoa thường)
    if (q) {
      whereCondition.title = ILike(`%${q}%`);
    }

    // 2. Lọc theo địa điểm (Dùng ILike cho chắc ăn)
    if (location && location !== 'Tất cả') {
      whereCondition.location = ILike(`%${location}%`);
    }

    // 3. Lọc Online/Offline
    if (is_online !== undefined && is_online !== 'Tất cả') {
      whereCondition.is_online = is_online === 'true';
    }

    // 4. Lọc theo ngày (Ví dụ: Tìm các sự kiện bắt đầu sau ngày này)
    if (start_date && start_date !== 'Tất cả') {
       // Xử lý logic ngày tháng tùy nhu cầu, ví dụ:
       // whereCondition.start_time = MoreThanOrEqual(new Date(start_date));
    }

    return this.eventsRepository.find({
      where: whereCondition,
      order: { start_time: 'ASC' }, // Sắp xếp sự kiện sắp tới lên đầu
      relations: ['ticket_types'],  // Lấy kèm thông tin vé để hiển thị giá ở card (nếu cần)
    });
  }

  // --- API Search với nhiều bộ lọc (Dùng Query Builder với ILIKE) ---
  async search(queryParams: {
    q?: string;
    location?: string;
    is_online?: boolean;
    start_date?: string;
    end_date?: string;
  }) {
    const query = this.eventsRepository.createQueryBuilder('event');

    // Tìm kiếm theo từ khóa (title, description) - Dùng ILIKE để không phân biệt hoa thường
    if (queryParams.q) {
      query.andWhere(
        '(event.title ILIKE :q OR event.description ILIKE :q)',
        { q: `%${queryParams.q}%` }
      );
    }

    // Lọc theo địa điểm - Dùng ILIKE
    if (queryParams.location && queryParams.location !== 'Tất cả') {
      query.andWhere('event.location ILIKE :location', { location: `%${queryParams.location}%` });
    }

    // Lọc Online/Offline
    if (queryParams.is_online !== undefined) {
      query.andWhere('event.is_online = :isOnline', { isOnline: queryParams.is_online });
    }

    // Lọc theo khoảng thời gian
    if (queryParams.start_date && queryParams.start_date !== 'Tất cả') {
      query.andWhere('event.start_time >= :startDate', { startDate: queryParams.start_date });
    }
    if (queryParams.end_date) {
      query.andWhere('event.start_time <= :endDate', { endDate: queryParams.end_date });
    }

    return query
      .leftJoinAndSelect('event.ticket_types', 'ticket_types')
      .orderBy('event.start_time', 'ASC')
      .getMany();
  }

  // --- Lấy sự kiện liên quan ---
  async findRelated(eventId: string, limit: number = 4) {
    const currentEvent = await this.eventsRepository.findOne({ where: { id: eventId } });
    if (!currentEvent) return [];

    const query = this.eventsRepository.createQueryBuilder('event')
      .where('event.id != :eventId', { eventId })
      .andWhere('event.start_time > :now', { now: new Date() });

    // Ưu tiên sự kiện cùng location - Dùng ILIKE
    if (currentEvent.location) {
      query.andWhere('event.location ILIKE :location', { location: `%${currentEvent.location}%` });
    }

    return query
      .leftJoinAndSelect('event.ticket_types', 'ticket_types')
      .orderBy('event.start_time', 'ASC')
      .limit(limit)
      .getMany();
  }

  // --- SỬA HÀM CHI TIẾT (Fix lỗi không hiện vé) ---
  async findOneBySlug(slug: string) {
    const event = await this.eventsRepository.findOne({
      where: { slug },
      // QUAN TRỌNG: Phải có dòng này mới lấy được danh sách vé
      relations: ['ticket_types'], 
    });

    if (!event) {
      throw new NotFoundException(`Sự kiện "${slug}" không tồn tại`);
    }
    return event;
  }
}