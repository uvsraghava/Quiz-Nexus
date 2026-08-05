import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();
    
    // NEW: Identify the requester
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    let query = {}; // Default admin query sees everything
    
    if (email) {
      const user = await User.findOne({ email });
      if (!user || user.role !== 'admin') {
        // Only fetch tests that are Global OR where the user is specifically eligible
        query = { 
          $or: [
            { isGlobal: { $ne: false } }, 
            { eligibleUsers: email }
          ] 
        };
      }
    }

    const tests = await Test.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ tests }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch tests:", error);
    return NextResponse.json({ message: 'Failed to load archive' }, { status: 500 });
  }
}