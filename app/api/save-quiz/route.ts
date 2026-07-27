import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();
    // Added 'duration' to the destructured JSON request
    const { title, subject, duration, questions, adminEmail } = await req.json();

    // Find the admin user to link the test creation
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      return NextResponse.json({ message: 'Admin user not found' }, { status: 404 });
    }

    // Create and save the new test, now including 'duration'
    const newTest = await Test.create({
      title,
      subject,
      duration, 
      questions,
      createdBy: admin._id
    });

    return NextResponse.json({ message: 'Quiz published successfully!', testId: newTest._id }, { status: 201 });
  } catch (error) {
    console.error("Database save error:", error);
    return NextResponse.json({ message: 'Failed to save quiz to database' }, { status: 500 });
  }
}