import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import User from '@/models/User';
import Test from '@/models/Test';

export const dynamic = 'force-dynamic';

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

    // --- NEW: VANGUARD SEASONAL CYCLE LOGIC ---
    // Fetch all tests sorted oldest to newest to calculate the current 3-test block
    const allTests = await Test.find({}).sort({ createdAt: 1 }).select('_id');
    const totalTests = allTests.length;
    let currentCycleTestIds: any[] = [];

    if (totalTests > 0) {
      // Logic: Tests 1-3 = Index 0. Tests 4-6 = Index 3. Tests 7-9 = Index 6.
      const cycleStartIndex = Math.floor((totalTests - 1) / 3) * 3;
      
      // Isolate only the test IDs belonging to the current active season
      currentCycleTestIds = allTests.slice(cycleStartIndex).map(t => t._id);
    }

    // 2. OVERALL LEADERBOARD (SEASONAL)
    // Aggregate cumulative scores ONLY for tests in the current cycle block
    const overallAgg = await Submission.aggregate([
      {
        $match: { 
          testId: { $in: currentCycleTestIds } 
        }
      },
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