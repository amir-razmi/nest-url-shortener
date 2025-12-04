/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { loginAdmin, loginUser, testUser } from 'test/helpers/auth.helper';

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
    const accessToken = await loginUser(app);

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
  it('should throw auth error when creating urls without auth', async () => {
    await request(app.getHttpServer())
      .post('/url/create')
      .send({ originalUrl: 'https://nestjs.com' })
      .expect(401);
  });
  it('delete short url', async () => {
    const accessToken = await loginUser(app);

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
  it('should throw auth error when deleting urls without auth', async () => {
    await request(app.getHttpServer()).delete(`/url/delete/id`).expect(401);
  });
  it('delete short url - unauthorized', async () => {
    const accessToken = await loginUser(app);

    const createRes = await request(app.getHttpServer())
      .post('/url/create')
      .set('Cookie', accessToken)
      .send({ originalUrl: 'https://nestjs.com' })
      .expect(201);

    const urlId = createRes.body.id as string;

    const anotherAccessToken = await loginUser(app, {
      ...testUser,
      email: 'Test2@gmail.com',
      username: 'amir2',
    });

    await request(app.getHttpServer())
      .delete(`/url/delete/${urlId}`)
      .set('Cookie', anotherAccessToken)
      .expect(403);
  });
  it('delete short url - not found', async () => {
    const accessToken = await loginUser(app);

    const createRes = await request(app.getHttpServer())
      .post('/url/create')
      .set('Cookie', accessToken)
      .send({ originalUrl: 'https://nestjs.com' })
      .expect(201);

    const urlId = createRes.body.id as string;

    await request(app.getHttpServer()).delete(`/url/delete/${urlId}`).set('Cookie', accessToken).expect(200);

    await request(app.getHttpServer()).delete(`/url/delete/${urlId}`).set('Cookie', accessToken).expect(404);
  });
  it('should get all urls with pagination', async () => {
    const accessToken = await loginUser(app);

    for (let i = 0; i < 15; i++) {
      await request(app.getHttpServer())
        .post('/url/create')
        .set('Cookie', accessToken)
        .send({ originalUrl: `https://nestjs.com/${i}` })
        .expect(201);
    }

    const resPage1 = await request(app.getHttpServer())
      .get('/url/all?page=1&limit=10')
      .set('Cookie', accessToken)
      .expect(200);

    expect(resPage1.body).toHaveProperty('urls');
    expect(resPage1.body.totalUrls).toBe(15);
    expect(resPage1.body.pagesCount).toBe(2);
    expect(resPage1.body.urls.length).toBe(10);
  });
  it('should throw auth error when getting urls without auth', async () => {
    await request(app.getHttpServer()).get('/url/all').expect(401);
  });
  it('should get all urls for admin', async () => {
    const accessTokens = [
      await loginUser(app),
      await loginUser(app, { ...testUser, email: 'test2@gmail.com', username: 'test2' }),
    ];

    for (let i = 0; i < 30; i++) {
      await request(app.getHttpServer())
        .post('/url/create')
        .set('Cookie', accessTokens[i % 2]) //Create urls for both users
        .send({ originalUrl: `https://nestjs.com/${i}` })
        .expect(201);
    }

    const adminAccessToken = await loginAdmin(app);

    const resPage1 = await request(app.getHttpServer())
      .get('/url/admin/all?page=1&limit=20')
      .set('Cookie', adminAccessToken)
      .expect(200);

    expect(resPage1.body).toHaveProperty('urls');
    expect(resPage1.body.totalUrls).toBe(30);
    expect(resPage1.body.pagesCount).toBe(2);
    expect(resPage1.body.urls.length).toBe(20);
  });
  it('should throw auth error when admin getting all urls without auth', async () => {
    await request(app.getHttpServer()).get('/url/admin/all').expect(401);
  });
});
