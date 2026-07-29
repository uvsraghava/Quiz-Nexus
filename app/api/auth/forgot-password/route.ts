import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendMail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    await sendMail({
      to: email,
      subject: '[QUIZ NEXUS] Security Override: Password Reset',
      html: `
        <div style="font-family: monospace; max-w: 600px; margin: 0 auto; background-color: #09090b; color: #e4e4e7; padding: 30px; border-radius: 10px; border: 1px solid #27272a;">
          <h2 style="color: #f43f5e; text-transform: uppercase;">Decryption Key Override Requested</h2>
          <p>Agent, a request has been made to reset the encryption protocols for your account.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; text-transform: uppercase; margin: 20px 0;">Reset Password</a>
          <p style="font-size: 12px; color: #71717a;">If you did not request this, ignore this transmission. Link expires in 1 hour.</p>
        </div>
      `
    });

    return NextResponse.json({ message: 'Email sent' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}