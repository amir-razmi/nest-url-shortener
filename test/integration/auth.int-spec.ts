/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import request from 'supertest';

const testUser = {
  email: 'Test@gmail.com',
  username: 'amir',
  password: 'P@ssw0rd',
};

describe('Auth (int)', () => {
  let prisma: PrismaService;
  let redis: RedisService;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);

    redis = moduleRef.get<RedisService>(RedisService);
    await redis.client.flushall();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.cleanDb();
  });

  it('/auth/register  should register user', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send(testUser).expect(201);
    expect(res.body).toHaveProperty('message');

    const userInDb = await prisma.user.findUnique({
      where: { email: testUser.email.toLowerCase() },
    });
    expect(userInDb).toBeTruthy();
    expect(userInDb?.isEmailVerified).toBe(false);
    expect(userInDb?.username).toBe(testUser.username);
    expect(userInDb?.password).not.toBe(testUser.password);
    expect(userInDb?.email).toBe(testUser.email.toLowerCase());

    const verificationTokenInRedis = await redis.verificationTokenService.get(testUser.email.toLowerCase());
    expect(verificationTokenInRedis).toBeTruthy();

    const verificationLastSentAtInRedis = await redis.verificationTokenService.getLastSentAt(
      testUser.email.toLowerCase(),
    );
    expect(verificationLastSentAtInRedis).toBeTruthy();
  });
});
