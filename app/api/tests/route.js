// app/api/tests/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';

export async function GET() {
  try {
    await dbConnect();
    // Fetch all tests, sorted by newest first
    const tests = await Test.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ tests }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch tests:", error);
    return NextResponse.json({ message: 'Failed to load archive' }, { status: 500 });
  }
}