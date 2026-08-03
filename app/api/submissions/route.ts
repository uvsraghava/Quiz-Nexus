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

    let score = 0;
    let submissionStatus = 'graded'; 

    if (test.testType === 'descriptive') {
      submissionStatus = 'pending';
    } else {
      // UPGRADED: Strict Array Comparison Engine
      test.questions.forEach((q: any, idx: number) => {
        const userAns = answers[idx]; 
        const correctAns = q.correctAnswer; 

        // Normalizes both legacy strings and new arrays into standard arrays for comparison
        const normalize = (val: any) => {
          if (!val) return [];
          return Array.isArray(val) ? val : [val];
        };

        const normUser = normalize(userAns);
        const normCorrect = normalize(correctAns);

        // Point awarded ONLY if array lengths match AND all correct options are present
        const isStrictlyCorrect = 
          normUser.length === normCorrect.length && 
          normCorrect.every((val: string) => normUser.includes(val));

        if (isStrictlyCorrect && normCorrect.length > 0) {
          score += 1;
        }
      });
    }

    await Submission.create({
      testId: testId,
      userId: user._id,
      score: score,
      totalQuestions: test.questions.length,
      answers: answers, 
      status: submissionStatus 
    });

    return NextResponse.json({ message: 'Success', score, total: test.questions.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to submit' }, { status: 500 });
  }
}