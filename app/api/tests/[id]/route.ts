import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';

export async function GET(
  req: Request,
  // Update the type to reflect that params is now a Promise
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    await dbConnect();
    
    // AWAIT the params object before extracting the ID
    const resolvedParams = await params;
    const testId = resolvedParams.id;
    
    // Find the single test in MongoDB
    const test = await Test.findById(testId);
    
    if (!test) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }
    
    // Send the test data back to the frontend
    return NextResponse.json(test, { status: 200 });
    
  } catch (error) {
    console.error("Failed to fetch specific test:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}