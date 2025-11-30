import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('api/v1/tracking')
export class TrackingController {
  
  @Post('view')
  @HttpCode(HttpStatus.NO_CONTENT) // Trả về 204
  trackView(@Body() viewData: any) {
    console.log('Tracking Event View:', viewData);
    return;
  }
}