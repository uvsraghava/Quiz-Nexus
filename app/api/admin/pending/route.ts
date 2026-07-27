import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    // Security Check
    const adminUser = await User.findOne({ email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const pendingUsers = await User.find({ isApproved: false }).select('name email createdAt');
    return NextResponse.json({ pendingUsers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching pending users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { adminEmail, targetUserId, action } = await req.json();

    // Security Check
    const admin = await User.findOne({ email: adminEmail });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'approve') {
      await User.findByIdAndUpdate(targetUserId, { isApproved: true });
    } else if (action === 'reject') {
      await User.findByIdAndDelete(targetUserId);
    }

    return NextResponse.json({ message: `User ${action}d successfully` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Action failed' }, { status: 500 });
  }
}