import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Test from '@/models/Test';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');
    const email = searchParams.get('email');

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ hasTaken: false });

    // FIXED: Using testId and userId to match your schema
    const existingSubmission = await Submission.findOne({ testId: testId, userId: user._id });
    return NextResponse.json({ hasTaken: !!existingSubmission }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error checking submission' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { testId, userEmail, answers } = await req.json();

    const user = await User.findOne({ email: userEmail });
    const test = await Test.findById(testId);
    
    if (!user || !test) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    // GRADE THE TEST
    let score = 0;
    test.questions.forEach((q: any, idx: number) => {
      if (answers[idx] === q.correctAnswer) {
        score += 1;
      }
    });

    // FIXED: Added 'answers' to the database creation payload
    await Submission.create({
      testId: testId,
      userId: user._id,
      score: score,
      totalQuestions: test.questions.length,
      answers: answers // This ensures the answers are actually saved to MongoDB!
    });

    return NextResponse.json({ message: 'Success', score, total: test.questions.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to submit' }, { status: 500 });
  }
}