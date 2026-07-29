import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Test from '@/models/Test'; // Needed to populate

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const adminEmail = searchParams.get('adminEmail');

    // Verify admin
    const admin = await User.findOne({ email: adminEmail });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Fetch the specific submission and populate the test and user data
    const submission = await Submission.findById(id)
      .populate('testId')
      .populate('userId', 'name email');
      
    if (!submission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission }, { status: 200 });
  } catch (error) {
    console.error("Evaluation GET error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { submissionId, adminEmail, score, feedback, maxMarks } = await req.json();

    // Verify admin
    const admin = await User.findOne({ email: adminEmail });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Update the submission with the score, feedback, and switch status to graded
    await Submission.findByIdAndUpdate(submissionId, {
      score: score,
      totalQuestions: maxMarks, // Override so the frontend history displays Score / MaxMarks correctly
      feedback: feedback,
      status: 'graded'
    });

    return NextResponse.json({ message: 'Evaluation successful' }, { status: 200 });
  } catch (error) {
    console.error("Evaluation POST error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}