import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    // Verify Admin Authorization
    const admin = await User.findOne({ email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // UPGRADED: Fetches ALL approved agents, including yourself
    const users = await User.find({ isApproved: true })
                            .select('name email')
                            .sort({ name: 1 });
                            
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch user roster:", error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}