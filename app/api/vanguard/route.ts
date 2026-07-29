import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();

    const vanguardData = await Submission.aggregate([
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$score' } 
        }
      },
      { $sort: { totalPoints: -1 } }
    ]);

    if (vanguardData.length === 0) {
      return NextResponse.json({ topUser: null, allUsers: [] });
    }

    const populatedData = await Promise.all(vanguardData.map(async (entry) => {
      const user = await User.findById(entry._id).select('name email');
      return {
        userId: entry._id,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        totalPoints: entry.totalPoints
      };
    }));

    return NextResponse.json({
      topUser: populatedData[0],
      allUsers: populatedData
    }, { status: 200 });

  } catch (error) {
    console.error("Vanguard API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}