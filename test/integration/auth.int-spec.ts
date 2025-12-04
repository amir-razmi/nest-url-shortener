/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import request from 'supertest';

export const testUser = {
  email: 'Test@gmail.com',
  username: 'amir',
  password: 'P@ssw0rd',
};

export const registerUser = async (app: INestApplication, userData = testUser, verifyEmail = false) => {
  await request(app.getHttpServer()).post('/auth/register').send(userData).expect(201);

  if (verifyEmail) {
    const redis = app.get(RedisService);

    const token = await redis.verificationTokenService.get(userData.email.toLowerCase());
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: userData.email, token })
      .expect(201);
  }
};
export const getAccessTokenCookie = async (app: INestApplication, userData = testUser) => {
  await registerUser(app, userData, true); //Register and verify

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: userData.email, password: userData.password })
    .expect(201);
  return res.headers['set-cookie'][0].split(';')[0];
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
    const startTime = Date.now();

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
    expect(+verificationLastSentAtInRedis!).toBeGreaterThanOrEqual(startTime);
  });
  it('/auth/register  should not allow duplicate emails', async () => {
    await registerUser(app);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...testUser, username: 'another' + testUser.username })
      .expect(409);
  });
  it('/auth/register  should not allow duplicate usernames', async () => {
    await registerUser(app);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...testUser, email: 'another' + testUser.email })
      .expect(409);
  });
  it('/auth/register  should allow re-registration if email not verified in 24 hours', async () => {
    await registerUser(app);

    //! I'm not using mocking of time here because it caused some issues with prisma client

    const userInDb = await prisma.user.findUnique({ where: { email: testUser.email.toLowerCase() } });
    await prisma.user.update({
      where: { id: userInDb?.id },
      data: { createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25) }, //Set createdAt to 25 hours ago
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...testUser, username: 'another' + testUser.username })
      .expect(201);
  });

  it('/auth/verify-email  should verify email', async () => {
    await registerUser(app);

    const token = await redis.verificationTokenService.get(testUser.email.toLowerCase());
    expect(token).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: testUser.email, token })
      .expect(201);
    expect(res.body).toHaveProperty('message');

    const userInDb = await prisma.user.findUnique({
      where: { email: testUser.email.toLowerCase() },
    });
    expect(userInDb).toBeTruthy();
    expect(userInDb?.isEmailVerified).toBe(true);

    const verificationTokenInRedis = await redis.verificationTokenService.get(testUser.email.toLowerCase());
    expect(verificationTokenInRedis).toBeNull();
  });

  it('/auth/verify-email  should not verify with invalid token', async () => {
    await registerUser(app);

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: testUser.email, token: 'invalid' })
      .expect(400);

    const userInDb = await prisma.user.findUnique({
      where: { email: testUser.email.toLowerCase() },
    });
    expect(userInDb).toBeTruthy();
    expect(userInDb?.isEmailVerified).toBe(false);
  });
  it('/auth/resend-verification-email  should resend verification email', async () => {
    const startTime = Date.now();

    await registerUser(app);

    const firstToken = await redis.verificationTokenService.get(testUser.email.toLowerCase());
    expect(firstToken).toBeTruthy();

    const firstSentAt = await redis.verificationTokenService.getLastSentAt(testUser.email.toLowerCase());
    expect(firstSentAt).toBeTruthy();
    expect(+firstSentAt!).toBeGreaterThanOrEqual(startTime);

    await redis.verificationTokenService.delete(testUser.email.toLowerCase()); //Simulate token expiry by deleting it

    const res = await request(app.getHttpServer())
      .post('/auth/resend-verification-email')
      .send({ email: testUser.email })
      .expect(201);
    expect(res.body).toHaveProperty('message');

    const secondToken = await redis.verificationTokenService.get(testUser.email.toLowerCase());
    expect(secondToken).toBeTruthy();
    expect(secondToken).not.toBe(firstToken);

    const secondSentAt = await redis.verificationTokenService.getLastSentAt(testUser.email.toLowerCase());
    expect(secondSentAt).toBeTruthy();
    expect(+secondSentAt!).toBeGreaterThanOrEqual(startTime);
  });
  it('/auth/resend-verification-email  should not resend too frequently', async () => {
    const startTime = Date.now();

    await registerUser(app);

    const firstToken = await redis.verificationTokenService.get(testUser.email.toLowerCase());
    expect(firstToken).toBeTruthy();

    const firstSentAt = await redis.verificationTokenService.getLastSentAt(testUser.email.toLowerCase());
    expect(firstSentAt).toBeTruthy();
    expect(+firstSentAt!).toBeGreaterThanOrEqual(startTime);

    const res = await request(app.getHttpServer())
      .post('/auth/resend-verification-email')
      .send({ email: testUser.email })
      .expect(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('retryAfter');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(res.body.retryAfter).toBeGreaterThan(+firstSentAt!);

    const secondToken = await redis.verificationTokenService.get(testUser.email.toLowerCase());
    expect(secondToken).toBeTruthy();
    expect(secondToken).toBe(firstToken);

    const secondSentAt = await redis.verificationTokenService.getLastSentAt(testUser.email.toLowerCase());
    expect(secondSentAt).toBeTruthy();
    expect(secondSentAt).toBe(firstSentAt);
  });
  it('/auth/login should login verified user', async () => {
    await registerUser(app, undefined, true); //Register and verify

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);
    expect(res.body).toHaveProperty('message');
    expect(res.headers).toHaveProperty('set-cookie');
    expect(Array.isArray(res.headers['set-cookie'])).toBe(true);
    expect(res.headers['set-cookie'][0]).toMatch(/accessToken=/);
  });
  it('/auth/login should not login unverified user', async () => {
    await registerUser(app); //Register but do not verify

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(403);
  });
  it('/auth/login should not login with wrong password', async () => {
    await registerUser(app, undefined, true); //Register and verify

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrong' + testUser.password })
      .expect(401);
  });
});
