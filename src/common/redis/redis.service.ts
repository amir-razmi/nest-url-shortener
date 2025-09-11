import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from 'src/env';

@Injectable()
export class RedisService implements OnModuleDestroy {
  client: Redis;

  constructor() {
    this.client = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
