'use client';

interface VanguardBannerProps {
  leaderboard: any[];
  currentUserEmail?: string | null;
  season?: number;
}

export default function VanguardBanner({ leaderboard, currentUserEmail, season = 1 }: VanguardBannerProps) {
  if (!leaderboard || leaderboard.length === 0) return null;

  // Tie-Breaker Logic: Find ALL agents with the top score
  const maxScore = leaderboard[0].score;
  const topAgents = leaderboard.filter(u => u.score === maxScore);
  const topNames = topAgents.map(a => a.name).join(' & ');

  let message = "";

  if (currentUserEmail) {
    const currentUserIndex = leaderboard.findIndex((u) => u.email === currentUserEmail);
    const currentUser = leaderboard[currentUserIndex];

    if (currentUser && currentUser.score === maxScore) {
      message = topAgents.length > 1 
        ? "You are tied for 1st place! Break the tie on the next mission." 
        : "You are currently holding 1st place! Defend your position.";
    } else if (currentUser) {
      const pointsNeeded = maxScore - currentUser.score + 1;
      message = `You need ${pointsNeeded} more point(s) to take the outright lead.`;
    } else {
      message = "Deploy into a mission to get on the board!";
    }
  }

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(251,146,60,0.05)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
      <div>
        <h2 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-2">
          🏆 SEASON {season} VANGUARD
        </h2>
        <p className="text-zinc-200 text-sm md:text-base">
          <span className="font-bold text-white">{topNames}</span> {topAgents.length > 1 ? 'are' : 'is'} commanding the lead with <span className="font-black text-orange-400">{maxScore}</span> Points!
        </p>
      </div>
      {message && (
        <div className="text-xs md:text-sm font-medium text-zinc-400 bg-zinc-950/50 px-4 py-3 rounded-xl border border-zinc-800">
          {message}
        </div>
      )}
    </div>
  );
}