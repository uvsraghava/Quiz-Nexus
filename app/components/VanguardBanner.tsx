'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function VanguardBanner() {
  const { data: session } = useSession();
  const [vanguard, setVanguard] = useState<any>(null);
  const [myPoints, setMyPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVanguard() {
      try {
        const res = await fetch('/api/vanguard');
        const data = await res.json();
        
        if (data.topUser) {
          setVanguard(data.topUser);
          
          if (session?.user?.email) {
            // FIX: Added optional chaining to session?.user?.email inside the callback
            const me = data.allUsers.find((u: any) => u.email === session?.user?.email);
            if (me) setMyPoints(me.totalPoints);
          }
        }
      } catch (error) {
        console.error("Failed to fetch vanguard stats", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (session) fetchVanguard();
  }, [session]);

  if (loading || !vanguard) return null;

  const isTopUser = session?.user?.email === vanguard.email;
  const pointsNeeded = vanguard.totalPoints - myPoints;

  return (
    <div className="bg-gradient-to-r from-orange-600/10 to-red-600/10 border border-orange-500/30 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between shadow-lg shadow-orange-900/20">
      <div>
        <h2 className="text-sm tracking-widest font-bold text-orange-500 uppercase mb-1">
          🏆 Overall Vanguard
        </h2>
        <p className="text-gray-300 text-lg">
          <span className="font-extrabold text-white text-xl">{vanguard.name}</span> is commanding the lead with <span className="font-extrabold text-orange-400 text-xl">{vanguard.totalPoints}</span> Points!
        </p>
      </div>
      
      <div className="mt-4 md:mt-0 text-right">
        {isTopUser ? (
          <p className="text-green-400 font-bold animate-pulse text-lg tracking-wide">
            You are the Vanguard. Maintain the lead!
          </p>
        ) : (
          <p className="text-gray-400">
            You need <span className="text-orange-500 font-bold text-2xl mx-1">{pointsNeeded}</span> more points to claim 1st place.
          </p>
        )}
      </div>
    </div>
  );
}