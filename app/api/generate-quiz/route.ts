import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GoogleGenAI } from '@google/genai';
import dbConnect from '@/lib/mongodb';
import Test from '@/models/Test';

// Initialize the official SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    // 1. Secure the route: Only logged-in users can generate tests
    const session = await getServerSession();
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { title, subject, syllabusText } = await req.json();
    if (!syllabusText) {
      return NextResponse.json({ message: 'Syllabus text is required' }, { status: 400 });
    }

    // 2. Define the strict JSON schema for exactly 20 questions
    const responseSchema = {
      type: "ARRAY",
      description: "A list of exactly 20 multiple choice questions.",
      items: {
        type: "OBJECT",
        properties: {
          questionText: { 
            type: "STRING", 
            description: "The multiple choice question." 
          },
          options: { 
            type: "ARRAY", 
            items: { type: "STRING" },
            description: "Exactly 4 options for the question."
          },
          correctAnswer: { 
            type: "STRING", 
            description: "The exact string of the correct option." 
          }
        },
        required: ["questionText", "options", "correctAnswer"]
      }
    };

    // 3. Call the Gemini API using Structured Outputs
    const prompt = `Generate exactly 20 multiple-choice questions based on the following syllabus/material. \n\nMaterial:\n${syllabusText}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    // 4. Parse the generated JSON array
    const questions = JSON.parse(response.text || "[]");

    // 5. Save the generated test directly to MongoDB
    await dbConnect();
    const newTest = await Test.create({
      title,
      subject,
      questions,
      createdBy: (session.user as any).id
    });

    return NextResponse.json({ 
      message: 'Quiz generated successfully', 
      testId: newTest._id 
    }, { status: 201 });

  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ message: 'Failed to generate quiz' }, { status: 500 });
  }
}