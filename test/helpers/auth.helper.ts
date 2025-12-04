/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma/prisma.service';
import { RedisService } from 'src/common/db/redis/redis.service';
import request from 'supertest';

export const testUser = {
  email: 'Test@gmail.com',
  username: 'amir',
  password: 'P@ssw0rd',
};
export const testAdmin = {
  email: 'admin@gmail.com',
  username: 'admin',
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

export const loginUser = async (app: INestApplication, userData = testUser) => {
  await registerUser(app, userData, true); //Register and verify

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: userData.email, password: userData.password })
    .expect(201);
  return res.headers['set-cookie'][0].split(';')[0];
};

export const loginAdmin = async (app: INestApplication) => {
  await registerUser(app, testAdmin, true);

  const prisma = app.get(PrismaService);
  await prisma.user.update({ where: { email: testAdmin.email }, data: { role: 'Admin' } });

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: testAdmin.email, password: testUser.password })
    .expect(201);
  return res.headers['set-cookie'][0].split(';')[0];
};
