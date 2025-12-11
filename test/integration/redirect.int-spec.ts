/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import { generateRandomString } from 'src/common/utils/gen-rand-string.util';
import request from 'supertest';
import { testUser } from 'test/helpers/auth.helper';

describe('Redirect (int)', () => {
  let prisma: PrismaService;
  let redis: RedisService;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());

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
    await prisma.cleanDb();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.cleanDb();
  });

  it('should redirect user to the original url', async () => {
    const originalUrl = 'https://nestjs.com';
    const shortCode = generateRandomString(6);

    const { id: urlId } = await prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        User: {
          create: { ...testUser },
        },
      },
    });

    const visitsBefore = await prisma.urlVisit.findMany({ where: { urlId } });
    expect(visitsBefore.length).toBe(0);

    const res = await request(app.getHttpServer()).get(`/${shortCode}`).expect(302);

    expect(res.header.location).toBe(originalUrl);

    const visitsAfter = await prisma.urlVisit.findMany({ where: { urlId } });
    expect(visitsAfter.length).toBe(1);
    expect(visitsAfter[0].urlId).toBe(urlId);
  });
  it('should return 404 if short URL does not exist', async () => {
    const shortCode = generateRandomString(6);

    const res = await request(app.getHttpServer()).get(`/${shortCode}`);

    expect(res.status).toBe(404);
  });
});
