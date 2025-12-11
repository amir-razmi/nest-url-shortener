/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import { generateRandomString } from 'src/common/utils/gen-rand-string.util';
import request from 'supertest';
import { loginAdmin, loginUser, testUser } from 'test/helpers/auth.helper';

describe('Visit (Int)', () => {
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

  it('get visits for a short URL', async () => {
    const originalUrl = 'https://nestjs.com';
    const shortCode = generateRandomString(6);

    const accessToken = await loginUser(app);
    const user = await prisma.user.findFirst();

    const { id: urlId } = await prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        userId: user!.id,
      },
    });

    for (let i = 0; i < 15; i++) {
      await request(app.getHttpServer()).get(`/${shortCode}`).expect(302);
    }

    // Fetch page 1
    const res = await request(app.getHttpServer())
      .get(`/visit/single/${urlId}?page=1&limit=10`)
      .set('Cookie', accessToken)
      .expect(200);

    expect(res.body).toHaveProperty('visits');
    expect(res.body.visits.length).toBe(10);
    expect(res.body).toHaveProperty('totalVisits', 15);
    expect(res.body).toHaveProperty('totalPages', 2);

    // Fetch page 2
    const res2 = await request(app.getHttpServer())
      .get(`/visit/single/${urlId}?page=2&limit=10`)
      .set('Cookie', accessToken)
      .expect(200);

    expect(res2.body).toHaveProperty('visits');
    expect(res2.body.visits.length).toBe(5);
    expect(res2.body).toHaveProperty('totalVisits', 15);
    expect(res2.body).toHaveProperty('totalPages', 2);
  });
  it('should throw unauthorized error when fetching visits without auth', async () => {
    const { id: urlId } = await prisma.url.create({
      data: {
        originalUrl: 'https://nestjs.com',
        shortCode: generateRandomString(6),
        User: {
          create: { ...testUser },
        },
      },
    });

    await request(app.getHttpServer()).get(`/visit/single/${urlId}?page=1&limit=10`).expect(401);
  });
  it('should throw not found error when fetching visits for non-existing url', async () => {
    const accessToken = await loginUser(app);

    const nonExistingUrlId = (await prisma.user.findFirstOrThrow()).id; //Using user id as non-existing url id

    await request(app.getHttpServer())
      .get(`/visit/${nonExistingUrlId}?page=1&limit=10`)
      .set('Cookie', accessToken)
      .expect(404);
  });
  it('should throw unauthorized error when fetching visits for url not owned by user', async () => {
    const { id: urlId } = await prisma.url.create({
      data: {
        originalUrl: 'https://nestjs.com',
        shortCode: generateRandomString(6),
        User: {
          create: { ...testUser, email: testUser.email + '1', username: testUser.username + '1' },
        },
      },
    });

    const accessToken = await loginUser(app);

    await request(app.getHttpServer())
      .get(`/visit/single/${urlId}?page=1&limit=10`)
      .set('Cookie', accessToken)
      .expect(401);
  });
  it('get all visits (admin)', async () => {
    const accessToken = await loginAdmin(app);

    // Create some visits
    for (let i = 0; i < 25; i++) {
      const shortCode = generateRandomString(6);

      await prisma.url.create({
        data: {
          originalUrl: `https://nestjs.com/${i}`,
          shortCode,
          User: {
            create: { ...testUser, email: testUser.email + i, username: testUser.username + i },
          },
        },
      });

      for (let j = 0; j < 3; j++) {
        await request(app.getHttpServer()).get(`/${shortCode}`).expect(302);
      }
    }

    // Test all pages
    for (let i = 1; i < 9; i++) {
      const res = await request(app.getHttpServer())
        .get(`/visit/all?page=${i}&limit=10`)
        .set('Cookie', accessToken)
        .expect(200);

      expect(res.body).toHaveProperty('visits');
      expect(res.body.visits.length).toBe(i === 8 ? 5 : 10);
      expect(res.body).toHaveProperty('totalVisits', 75);
      expect(res.body).toHaveProperty('totalPages', 8);
    }
  });
  it('should throw unauthorized error when fetching all visits as non-admin', async () => {
    const accessToken = await loginUser(app);

    await request(app.getHttpServer())
      .get('/visit/all?page=1&limit=10')
      .set('Cookie', accessToken)
      .expect(403);
  });
  it('should throw unauthorized error when fetching all visits without auth', async () => {
    await request(app.getHttpServer()).get('/visit/all?page=1&limit=10').expect(401);
  });
});
