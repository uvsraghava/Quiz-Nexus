import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();
    // Added 'duration' and 'startTime' to the destructured JSON request
    const { title, subject, duration, startTime, questions, adminEmail } = await req.json();

    // Find the admin user to link the test creation
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      return NextResponse.json({ message: 'Admin user not found' }, { status: 404 });
    }

    // Create and save the new test, now including 'duration' and 'startTime'
    const newTest = await Test.create({
      title,
      subject,
      duration,
      startTime, // NEW: Include startTime in the database payload
      questions,
      createdBy: admin._id
    });

    return NextResponse.json({ message: 'Quiz published successfully!', testId: newTest._id }, { status: 201 });
  } catch (error) {
    console.error("Database save error:", error);
    return NextResponse.json({ message: 'Failed to save quiz to database' }, { status: 500 });
  }
}