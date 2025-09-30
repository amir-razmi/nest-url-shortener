export const generateShortCode = async (length: number) => {
  const { nanoid } = await import('nanoid');
  return nanoid(length);
};
