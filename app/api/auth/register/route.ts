import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Make the first registered user the Admin automatically
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'student';
    const isApproved = userCount === 0 ? true : false; 

    await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role, 
      isApproved 
    });

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
} catch (error) {
    // Add this line so your VS Code terminal tells you exactly what breaks next time
    console.error("Registration error:", error); 
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
  }
}