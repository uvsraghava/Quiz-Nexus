import nodemailer from 'nodemailer';

export const sendMail = async (options: { to?: string, bcc?: string[], subject: string, html: string }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter.sendMail({
    from: `"Nexus Command" <${process.env.EMAIL_USER}>`,
    ...options
  });
};