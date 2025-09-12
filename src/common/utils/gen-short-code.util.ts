import { nanoid } from 'nanoid';

export const generateShortCode = (length: number) => {
  return nanoid(length);
};
