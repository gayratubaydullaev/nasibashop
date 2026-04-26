import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { pingKafkaTCP } from './kafka-ping.util';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongo: Connection,
    private readonly config: ConfigService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    if (this.mongo.readyState !== 1) {
      throw new HttpException(
        {
          status: 'unavailable',
          component: 'mongodb',
          detail: 'not connected',
          checks: { mongodb: 'DOWN' },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    try {
      const db = this.mongo.db;
      if (!db) {
        throw new HttpException(
          {
            status: 'unavailable',
            component: 'mongodb',
            detail: 'no db handle',
            checks: { mongodb: 'DOWN' },
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      await db.admin().command({ ping: 1 });
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException(
        {
          status: 'unavailable',
          component: 'mongodb',
          checks: { mongodb: 'DOWN' },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const kafka = (this.config.get<string>('KAFKA_BROKERS') ?? '').trim();
    if (kafka) {
      try {
        await pingKafkaTCP(kafka);
      } catch {
        throw new HttpException(
          {
            status: 'unavailable',
            component: 'kafka',
            checks: { mongodb: 'UP', kafka: 'DOWN' },
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    const checks: Record<string, string> = {
      mongodb: 'UP',
      kafka: kafka ? 'UP' : 'SKIPPED',
    };
    return { status: 'ok', checks };
  }
}
