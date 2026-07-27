// app/api/submissions/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Test from '@/models/Test';

export async function GET(
  req: Request,
  // Next.js 15 requires params to be treated as a Promise
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const submissionId = resolvedParams.id;

    // 1. Fetch the user's submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    // 2. Fetch the corresponding test to get the questions and correct answers
    // (Handling both 'test' and 'testId' naming conventions just in case)
    const testReference = submission.test || submission.testId;
    const test = await Test.findById(testReference);

    if (!test) {
      return NextResponse.json({ message: 'Associated test not found' }, { status: 404 });
    }

    return NextResponse.json({ submission, test }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch review data:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}