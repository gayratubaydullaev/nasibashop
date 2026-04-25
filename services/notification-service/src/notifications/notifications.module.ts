import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelDispatcherService } from './channel-dispatcher.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationEntity, NotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NotificationEntity.name, schema: NotificationSchema }]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    ChannelDispatcherService,
    KafkaConsumerService,
  ],
})
export class NotificationsModule {}
