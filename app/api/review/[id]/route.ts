import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Test from '@/models/Test';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    // The ID from the URL is the Submission ID
    const submissionId = params.id;
    
    const submission = await Submission.findById(submissionId)
      .populate('testId')
      .populate('userId', 'email name');

    if (!submission) {
      return NextResponse.json({ message: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json({ submission }, { status: 200 });
  } catch (error) {
    console.error("Review Fetch Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}