export const VERIFY_EMAIL_SUBJECT = 'Verify your email';
export const VERIFY_EMAIL_HTML = (username: string, token: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #4CAF50;">Welcome to Our Service, ${username}!</h2>
    <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
    <a href="http://localhost:5000/auth/verify-email?token=${token}" 
        style="display: inline-block; padding: 10px 20px; margin: 10px 0; 
        font-size: 16px; color: #fff; background-color: #4CAF50; text-decoration: none;
        border-radius: 5px;">Verify Email</a>
    <p>If you did not sign up for this account, please ignore this email.</p>
    <p>Best regards,<br/>The Team</p>
  </div>
`;
