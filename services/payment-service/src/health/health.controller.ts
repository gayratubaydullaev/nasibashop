import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { pingKafkaTCP, pingRedis } from './deps-ping.util';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new HttpException(
        {
          status: 'unavailable',
          component: 'postgres',
          checks: { postgres: 'DOWN' },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const redisHost = this.config.get<string>('REDIS_HOST', 'localhost');
    const redisPort = Number(this.config.get<string>('REDIS_PORT', '6379'));
    try {
      await pingRedis(redisHost, redisPort);
    } catch {
      throw new HttpException(
        {
          status: 'unavailable',
          component: 'redis',
          checks: { postgres: 'UP', redis: 'DOWN' },
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
            checks: { postgres: 'UP', redis: 'UP', kafka: 'DOWN' },
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    const checks: Record<string, string> = {
      postgres: 'UP',
      redis: 'UP',
      kafka: kafka ? 'UP' : 'SKIPPED',
    };
    return { status: 'ok', checks };
  }
}
