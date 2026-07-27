// app/api/submissions/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';

// CHECK IF ALREADY TAKEN
export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');
    const email = searchParams.get('email');

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ hasTaken: false });

    const existingSubmission = await Submission.findOne({ 
      test: testId, 
      user: user._id 
    });

    return NextResponse.json({ hasTaken: !!existingSubmission }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error checking submission' }, { status: 500 });
  }
}

// SAVE NEW TEST SUBMISSION
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { testId, userEmail, answers } = await req.json();

    const user = await User.findOne({ email: userEmail });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    await Submission.create({
      test: testId,
      user: user._id,
      answers
    });

    return NextResponse.json({ message: 'Test submitted successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to submit test' }, { status: 500 });
  }
}