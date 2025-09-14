import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Url } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private redis: RedisService) {
    super();
  }

  extendedPrisma: PrismaClient;

  async onModuleInit() {
    await this.$connect();
    this.setupCaching();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  private setupCaching() {
    const extended = this.$extends({
      query: {
        url: {
          $allOperations: async ({ operation, args, query }) => {
            //INFO: "Redirect" route is the most used route. that's why single-query operations are the only operations i'm caching.
            if (['findUnique', 'findFirst', 'findFirstOrThrough'].includes(operation)) {
              const { where: whereArg } = args as { where: Record<string, string> };

              let cachePattern = '';
              if (whereArg.id) cachePattern = `url:id=${whereArg.id}*`;
              else if (whereArg.shortCode) cachePattern = `url:*:shortCode=${whereArg.shortCode}`;

              const cached = await this.getCacheByPattern<unknown>(cachePattern);
              if (cached) return cached;

              const result = (await query(args)) as Url | null;
              if (result) {
                await this.setCache(`url:id=${result.id}:shortCode=${result.shortCode}`, result, 600);
              }
              return result;
            }

            if (['update', 'delete'].includes(operation)) {
              const result = (await query(args)) as Url;
              await this.redis.client.del(`url:id=${result.id}:shortCode=${result.shortCode}`);
              return result;
            }

            return query(args);
          },
        },
      },
    });

    this.extendedPrisma = extended as unknown as PrismaClient;
  }

  private async getCacheByPattern<T>(pattern: string): Promise<T | null> {
    const key = (await this.redis.client.keys(pattern))[0];

    const val = await this.redis.client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }

  private async setCache(key: string, value: any, ttlSeconds = 60) {
    await this.redis.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }
}
