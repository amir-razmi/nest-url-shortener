import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // url: 'mongodb://127.0.0.1:27018/url-shortner-test?directConnection=true',
    url: process.env.DATABASE_URL,
  },
});
