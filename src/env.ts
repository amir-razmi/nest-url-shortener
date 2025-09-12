import { createEnv } from '@t3-oss/env-core';
import { config } from 'dotenv';
import { z } from 'zod';

config();

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']),
    CORS: z.string().min(1),
    PORT: z.coerce.number().default(5000),
    SMTP_USER: z.email(),
    SMTP_PASS: z.string().min(1),
    EMAIL_FROM: z.email(),
    JWT_SECRET: z.string().min(32),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
