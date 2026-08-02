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
    const recentTest = await Test.findOne({}).sort({ createdAt: -1 });
    let recentLeaderboard: any[] = [];
    let recentTitle = "No Active Missions";

    if (recentTest) {
      recentTitle = recentTest.title;
      const recentSubs = await Submission.find({ testId: recentTest._id })
        .sort({ score: -1 })
        .limit(50)
        .populate({ path: 'userId', select: 'name email', model: User });

      recentLeaderboard = recentSubs.map((sub: any) => ({
        id: sub._id,
        name: sub.userId?.name || 'Unknown Agent',
        score: sub.score,
        total: sub.totalQuestions
      }));

      let rRank = 1, rPrevScore: number | null = null, rActual = 1;
      recentLeaderboard.forEach((u: any) => {
        if (rPrevScore !== null && u.score < rPrevScore) rRank = rActual;
        u.rank = rRank;
        rPrevScore = u.score;
        rActual++;
      });
      recentLeaderboard = recentLeaderboard.filter(u => u.rank <= 10);
    }

    // --- VANGUARD SEASONAL CYCLE LOGIC ---
    const allTests = await Test.find({}).sort({ createdAt: 1 }).select('_id');
    const totalTests = allTests.length;
    let currentCycleTestIds: any[] = [];
    let currentSeason = 1;
    let previousVanguards = null; // Will now be an array of top 3

    if (totalTests > 0) {
      currentSeason = Math.floor((totalTests - 1) / 3) + 1;
      const cycleStartIndex = (currentSeason - 1) * 3;
      currentCycleTestIds = allTests.slice(cycleStartIndex).map(t => t._id);

      // --- NEW: TOP 3 HALL OF FAME LOGIC ---
      if (currentSeason > 1) {
        const prevStartIndex = (currentSeason - 2) * 3;
        const prevTestIds = allTests.slice(prevStartIndex, prevStartIndex + 3).map(t => t._id);
        const prevStrings = prevTestIds.map(id => id.toString());

        const prevAgg = await Submission.aggregate([
          { $match: { $or: [{ testId: { $in: prevTestIds } }, { testId: { $in: prevStrings } }] } },
          { $group: { _id: '$userId', totalScore: { $sum: '$score' } } },
          { $sort: { totalScore: -1 } }
        ]);

        if (prevAgg.length > 0) {
          const prevUserIds = prevAgg.map((a: any) => a._id);
          const prevUsers = await User.find({ _id: { $in: prevUserIds } }, 'name');
          const prevUserMap: Record<string, string> = {};
          prevUsers.forEach(u => { prevUserMap[u._id.toString()] = u.name; });

          // Rank the previous season
          let pRank = 1, pPrevScore: number | null = null, pActual = 1;
          const rankedPrev = prevAgg.map((agg: any) => {
             const score = agg.totalScore;
             if (pPrevScore !== null && score < pPrevScore) pRank = pActual;
             const currentRank = pRank;
             pPrevScore = score;
             pActual++;
             
             return {
               rank: currentRank,
               score: score,
               name: prevUserMap[agg._id.toString()] || 'Unknown Agent'
             };
          });

          // Grab everyone who achieved Rank 1, 2, or 3 (captures all ties)
          previousVanguards = rankedPrev.filter(u => u.rank <= 3);
        }
      }
    }

    const currentCycleStrings = currentCycleTestIds.map(id => id.toString());

    // 2. OVERALL LEADERBOARD (SEASONAL)
    const overallAgg = await Submission.aggregate([
      {
        $match: { 
          $or: [
            { testId: { $in: currentCycleTestIds } },
            { testId: { $in: currentCycleStrings } }
          ]
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

    const userIds = overallAgg.map(agg => agg._id);
    const users = await User.find({ _id: { $in: userIds } }, 'name email'); 
    
    const userMap: Record<string, {name: string, email: string}> = {};
    users.forEach(u => { userMap[u._id.toString()] = { name: u.name, email: u.email }; });

    let overallLeaderboard = overallAgg.map(agg => ({
      id: agg._id,
      name: userMap[agg._id.toString()]?.name || 'Unknown Agent',
      email: userMap[agg._id.toString()]?.email || '',
      score: agg.totalScore,
      total: agg.totalPossible
    }));

    let oRank = 1, oPrevScore: number | null = null, oActual = 1;
    overallLeaderboard.forEach((u: any) => {
      if (oPrevScore !== null && u.score < oPrevScore) oRank = oActual;
      u.rank = oRank;
      oPrevScore = u.score;
      oActual++;
    });

    return NextResponse.json({ 
      recentTitle, 
      recentLeaderboard, 
      overallLeaderboard,
      currentSeason,
      previousVanguards
    }, { status: 200 });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ message: 'Failed to fetch leaderboards' }, { status: 500 });
  }
}