import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Test from '@/models/Test'; 

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email required' }, { status: 400 });
    }

    // Verify admin security clearance
    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 403 });
    }

    // Fetch all descriptive submissions waiting for manual review
    // We populate the testId and userId to display names and titles on the dashboard
    const evaluations = await Submission.find({ status: 'pending' })
      .populate('testId', 'title maxMarks testType')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ evaluations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching evaluation queue:", error);
    return NextResponse.json({ message: 'Failed to fetch evaluations' }, { status: 500 });
  }
}