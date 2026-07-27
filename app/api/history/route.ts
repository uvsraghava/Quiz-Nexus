import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Test from '@/models/Test'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ history: [] }, { status: 200 });

    const history = await Submission.find({ userId: user._id })
      .populate({ path: 'testId', select: 'title subject', model: Test })
      .sort({ createdAt: -1 });

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching history' }, { status: 500 });
  }
}