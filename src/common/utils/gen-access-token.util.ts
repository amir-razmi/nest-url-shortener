import jwt from 'jsonwebtoken';
import { env } from 'src/env';

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
};
