/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import request from 'supertest';
import { getAccessTokenCookie, testUser } from './auth.int-spec';
import cookieParser from 'cookie-parser';

describe('URL (int)', () => {
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

  it('should create short url', async () => {
    const accessToken = await getAccessTokenCookie(app);

    const res = await request(app.getHttpServer())
      .post('/url/create')
      .set('Cookie', accessToken)
      .send({ originalUrl: 'https://nestjs.com' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('originalUrl', 'https://nestjs.com');
    expect(res.body).toHaveProperty('shortCode');
    expect(res.body).toHaveProperty('createdAt');
  });
  it('delete short url', async () => {
    const accessToken = await getAccessTokenCookie(app);

    const createRes = await request(app.getHttpServer())
      .post('/url/create')
      .set('Cookie', accessToken)
      .send({ originalUrl: 'https://nestjs.com' })
      .expect(201);

    const urlId = createRes.body.id as string;

    await request(app.getHttpServer()).delete(`/url/delete/${urlId}`).set('Cookie', accessToken).expect(200);

    const fetchRecordFromDb = await prisma.url.findUnique({ where: { id: urlId } });
    expect(fetchRecordFromDb).toBeNull();
  });
  it('delete short url - unauthorized', async () => {
    const accessToken = await getAccessTokenCookie(app);

    const createRes = await request(app.getHttpServer())
      .post('/url/create')
      .set('Cookie', accessToken)
      .send({ originalUrl: 'https://nestjs.com' })
      .expect(201);

    const urlId = createRes.body.id as string;

    const anotherAccessToken = await getAccessTokenCookie(app, {
      ...testUser,
      email: 'Test2@gmail.com',
      username: 'amir2',
    });

    await request(app.getHttpServer())
      .delete(`/url/delete/${urlId}`)
      .set('Cookie', anotherAccessToken)
      .expect(403);
  });
});
