import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Test from '@/models/Test';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await dbConnect();

    // 1. RECENT MISSION LEADERBOARD
    // Find the latest test deployed
    const recentTest = await Test.findOne({}).sort({ createdAt: -1 });
    let recentLeaderboard: any[] = [];
    let recentTitle = "No Active Missions";

    if (recentTest) {
      recentTitle = recentTest.title;
      // Find top 10 submissions for THIS specific test
      const recentSubs = await Submission.find({ testId: recentTest._id })
        .sort({ score: -1 })
        .limit(10)
        .populate({ path: 'userId', select: 'name', model: User });

      recentLeaderboard = recentSubs.map((sub: any) => ({
        id: sub._id,
        name: sub.userId?.name || 'Unknown Agent',
        score: sub.score,
        total: sub.totalQuestions
      }));
    }

    // 2. OVERALL LEADERBOARD
    // Aggregate cumulative scores for all users across all tests. (LIMIT REMOVED)
    const overallAgg = await Submission.aggregate([
      { 
        $group: { 
          _id: '$userId', 
          totalScore: { $sum: '$score' },
          totalPossible: { $sum: '$totalQuestions' }
        } 
      },
      { $sort: { totalScore: -1 } }
    ]);

    // Safely map User data to the aggregated results to avoid serverless lookup bugs
    const userIds = overallAgg.map(agg => agg._id);
    const users = await User.find({ _id: { $in: userIds } }, 'name');
    
    // Create a dictionary of user IDs to Names
    const userMap: Record<string, string> = {};
    users.forEach(u => { userMap[u._id.toString()] = u.name; });

    const overallLeaderboard = overallAgg.map(agg => ({
      id: agg._id,
      name: userMap[agg._id.toString()] || 'Unknown Agent',
      score: agg.totalScore,
      total: agg.totalPossible
    }));

    return NextResponse.json({ 
      recentTitle, 
      recentLeaderboard, 
      overallLeaderboard 
    }, { status: 200 });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ message: 'Failed to fetch leaderboards' }, { status: 500 });
  }
}