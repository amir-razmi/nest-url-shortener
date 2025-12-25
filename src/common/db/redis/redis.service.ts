import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from 'src/env';
import { RedisVerificationTokenService } from './redis-verification-token.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  client: Redis;
  verificationTokenService: RedisVerificationTokenService;

  constructor() {
    this.client = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis successfully');
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.verificationTokenService = new RedisVerificationTokenService(this.client);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
