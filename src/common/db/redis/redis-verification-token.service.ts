import Redis from 'ioredis';

export class RedisVerificationTokenService {
  constructor(private redis: Redis) {}

  async set(email: string, emailVerificationToken: string) {
    await this.redis.set(`verificationToken:${email}`, emailVerificationToken, 'EX', 60 * 30);
    await this.redis.set(`lastVerificationEmailSentAt:${email}`, Date.now().toString(), 'EX', 60 * 3);
  }
  async get(email: string) {
    const storedToken = await this.redis.get(`verificationToken:${email}`);
    return storedToken;
  }
  async getLastSentAt(email: string) {
    const lastVerificationEmailSentAt = await this.redis.get(`lastVerificationEmailSentAt:${email}`);
    return lastVerificationEmailSentAt;
  }
}
