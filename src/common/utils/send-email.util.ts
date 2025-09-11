import nodemailer from 'nodemailer';
import { env } from 'src/env';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (email: string, subject: string, html: string) => {
  if (env.NODE_ENV !== 'production') return;

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    html,
  });
};
