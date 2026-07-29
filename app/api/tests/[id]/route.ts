import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const resolvedParams = await params;
    const testId = resolvedParams.id;
    
    const test = await Test.findById(testId);
    
    if (!test) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }
    
    return NextResponse.json(test, { status: 200 });
    
  } catch (error) {
    console.error("Failed to fetch specific test:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}