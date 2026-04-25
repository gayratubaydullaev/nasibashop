import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://127.0.0.1:27017/notification_service'),
      }),
    }),
    NotificationsModule,
    HealthModule,
  ],
})
export class AppModule {}
