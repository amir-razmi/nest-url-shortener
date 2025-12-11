/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import { loginAdmin, loginUser, testUser } from 'test/helpers/auth.helper';
import request from 'supertest';
import { generateRandomString } from 'src/common/utils/gen-rand-string.util';

describe('User (Int)', () => {
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

  it('should get profile of authenticated user', async () => {
    const accessToken = await loginUser(app);

    const res = await request(app.getHttpServer())
      .get('/user/profile')
      .set('Cookie', accessToken)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body.email).toBe(testUser.email);
    expect(res.body).toHaveProperty('createdAt');
  });
  it('should not get profile if not authenticated', async () => {
    await request(app.getHttpServer()).get('/user/profile').expect(401);
  });
  it('get all users as admin', async () => {
    for (let i = 0; i < 15; i++) {
      await prisma.user.create({
        data: {
          email: `${generateRandomString(5)}@gmail.com`,
          username: generateRandomString(5),
          password: 'P@ssw0rd',
        },
      });
    }

    const adminAccessToken = await loginAdmin(app);

    //Get first page
    const res = await request(app.getHttpServer())
      .get('/user/all?limit=10&page=1')
      .set('Cookie', adminAccessToken)
      .expect(200);

    expect(res.body).toHaveProperty('users');
    expect(res.body.users).toHaveLength(10);
    expect(res.body).toHaveProperty('totalUsers', 16);
    expect(res.body).toHaveProperty('pagesCount', 2);

    //Get second page
    const res2 = await request(app.getHttpServer())
      .get('/user/all?limit=10&page=2')
      .set('Cookie', adminAccessToken)
      .expect(200);

    expect(res2.body).toHaveProperty('users');
    expect(res2.body.users).toHaveLength(6);
    expect(res2.body).toHaveProperty('totalUsers', 16);
    expect(res2.body).toHaveProperty('pagesCount', 2);
  });
  it('should not get all users as non-admin', async () => {
    const accessToken = await loginUser(app);

    await request(app.getHttpServer()).get('/user/all').set('Cookie', accessToken).expect(403);
  });
  it('should not get all users if not authenticated', async () => {
    await request(app.getHttpServer()).get('/user/all').expect(401);
  });
});
