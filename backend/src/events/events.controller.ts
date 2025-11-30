// src/events/events.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(@Query() query: any) { // Nhận toàn bộ query params (?q=...&location=...)
    return this.eventsService.findAll(query);
  }

  @Get('search')
  search(@Query() queryParams: {
    q?: string;
    location?: string;
    is_online?: string;
    start_date?: string;
    end_date?: string;
  }) {
    return this.eventsService.search({
      ...queryParams,
      is_online: queryParams.is_online === 'true' ? true : queryParams.is_online === 'false' ? false : undefined,
    });
  }

  @Get('related/:id')
  findRelated(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.eventsService.findRelated(id, limit ? parseInt(limit) : 4);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.eventsService.findOneBySlug(slug);
  }
}