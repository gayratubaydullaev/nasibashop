import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('history')
  async history(
    @Query('userId') userId?: string,
    @Query('storeId') storeId?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = Math.min(100, Math.max(1, Number(limitStr ?? 20) || 20));
    const offset = Math.max(0, Number(offsetStr ?? 0) || 0);
    const { items, total } = await this.notifications.listHistory({ userId, storeId, limit, offset });
    return { notifications: items, pagination: { total, limit, offset } };
  }

  @Post('send')
  async send(@Body() body: SendNotificationDto) {
    const row = await this.notifications.sendManual({
      userId: body.userId,
      storeId: body.storeId,
      title: body.title,
      body: body.body,
      topic: body.topic,
      channels: body.channels,
    });
    return { id: row.id, ok: true };
  }
}
