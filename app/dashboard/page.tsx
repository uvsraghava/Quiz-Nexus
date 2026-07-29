'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import VanguardBanner from '@/app/components/VanguardBanner'; // NEW: Imported Banner

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // UPDATED: Added testType, caseStudyText, and maxMarks
  const [formData, setFormData] = useState({ 
    title: '', subject: '', duration: 30, jsonQuestions: '', scheduledTime: '',
    testType: 'mcq', caseStudyText: '', maxMarks: 100
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Data States
  const [archive, setArchive] = useState([]); 
  const [myHistory, setMyHistory] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingEvaluations, setPendingEvaluations] = useState([]); // NEW: State for subjective grading
  
  // Leaderboard States
  const [recentLeaderboard, setRecentLeaderboard] = useState([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState([]);
  const [recentTitle, setRecentTitle] = useState('Loading...');
  
  // Authorization States
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      checkUserStatus();
      fetchArchive();
      fetchLeaderboard();
      fetchMyHistory();
    }
  }, [session]);

  const checkUserStatus = async () => {
    try {
      const res = await fetch(`/api/user/status?email=${session?.user?.email}`);
      if (res.ok) {
        const data = await res.json();
        setIsApproved(data.isApproved);
        if (data.role === 'admin') {
          setIsAdmin(true);
          fetchPendingUsers();
          fetchPendingEvaluations(); // NEW: Fetch subjective tests needing review
        }
      }
    } catch (error) { console.error("Auth check failed"); } 
    finally { setAuthChecking(false); }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch(`/api/admin/pending?email=${session?.user?.email}`);
      if (res.ok) setPendingUsers((await res.json()).pendingUsers);
    } catch (error) { console.error("Failed to fetch pending applications"); }
  };

  // NEW: Fetch pending descriptive evaluations
  const fetchPendingEvaluations = async () => {
    try {
      const res = await fetch(`/api/admin/evaluations?email=${session?.user?.email}`);
      if (res.ok) {
        const data = await res.json();
        setPendingEvaluations(data.evaluations || []);
      }
    } catch (error) { console.error("Failed to fetch evaluations queue"); }
  };

  const handleUserAction = async (targetUserId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: session?.user?.email, targetUserId, action })
      });
      if (res.ok) fetchPendingUsers();
    } catch (error) { console.error(`Failed to ${action} user`); }
  };

  const fetchArchive = async () => {
    try {
      const res = await fetch('/api/tests');
      if (res.ok) setArchive((await res.json()).tests);
    } catch (error) { console.error(error); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setRecentLeaderboard(data.recentLeaderboard || []);
        setOverallLeaderboard(data.overallLeaderboard || []);
        setRecentTitle(data.recentTitle || 'Unknown Test');
      }
    } catch (error) { console.error("Failed to fetch leaderboard"); }
  };

  const fetchMyHistory = async () => {
    try {
      const res = await fetch(`/api/history?email=${session?.user?.email}`);
      if (res.ok) setMyHistory((await res.json()).history);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      let parsedQuestions = JSON.parse(formData.jsonQuestions);
      
      // Auto-format strings to question objects if deploying Case Study mode
      if (formData.testType === 'descriptive' && typeof parsedQuestions[0] === 'string') {
        parsedQuestions = parsedQuestions.map((q: string) => ({ questionText: q }));
      }

      let finalStartTime = null;
      if (formData.scheduledTime) {
        finalStartTime = new Date(`${formData.scheduledTime}+05:30`).toISOString();
      }

      const res = await fetch('/api/save-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          subject: formData.subject,
          duration: Number(formData.duration),
          questions: parsedQuestions,
          adminEmail: session?.user?.email, 
          startTime: finalStartTime,
          testType: formData.testType,
          caseStudyText: formData.testType === 'descriptive' ? formData.caseStudyText : undefined,
          maxMarks: formData.testType === 'descriptive' ? Number(formData.maxMarks) : undefined
        }),
      });
      if (res.ok) {
        setMessage('Protocol deployed to the mainframe. 🚀');
        setFormData({ title: '', subject: '', duration: 30, jsonQuestions: '', scheduledTime: '', testType: 'mcq', caseStudyText: '', maxMarks: 100 });
        fetchArchive(); 
        fetchLeaderboard(); 
      } else {
        setMessage('Failed to publish assessment');
      }
    } catch (error) {
      setMessage('Invalid JSON format. Please check your syntax.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERING BLOCK ---

  if (status === 'loading' || authChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-rose-500 flex items-center justify-center animate-pulse font-mono uppercase tracking-widest text-sm md:text-base">
        Authenticating Identity...
      </div>
    );
  }

  if (!isApproved && !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl border border-zinc-800 text-center max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl md:text-3xl">⏳</div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest mb-2 text-zinc-100">Awaiting Clearance</h2>
          <p className="text-zinc-500 mb-8 text-sm md:text-base leading-relaxed">Your registration has been logged. Access to Quiz Nexus will be granted once the Admin verifies your identity.</p>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-widest text-xs md:text-sm shadow-lg">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-200 p-4 md:p-8 font-sans selection:bg-rose-500/30">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
        
        {/* TOP NAVBAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800/80 pb-6 relative gap-4 md:gap-0">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 drop-shadow-sm">
              {isAdmin ? 'Nexus Command' : 'Quiz Nexus'}
            </h1>
            <p className="text-zinc-400 mt-1 md:mt-2 font-medium tracking-wide text-sm md:text-base">
              Welcome back, {session?.user?.name || 'Agent'}
            </p>
          </div>
          <div className="w-full md:w-auto flex justify-end">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-full transition-colors shadow-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white ${isAdmin ? 'bg-gradient-to-br from-rose-600 to-orange-500' : 'bg-gradient-to-br from-zinc-600 to-zinc-400'}`}>
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium pr-2">{session?.user?.name || 'Profile'}</span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-full md:w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
                <div className="p-4 border-b border-zinc-800">
                  <p className="text-sm font-bold text-white truncate">{session?.user?.name}</p>
                  <p className="text-xs text-zinc-500 truncate mt-1">{session?.user?.email}</p>
                </div>
                <div className="p-2">
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-4 py-3 text-xs md:text-sm font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NEW: Vanguard Banner Display */}
        <VanguardBanner />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {isAdmin && (
              <>
                <div className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl transition-all">
                  <h2 className="text-lg md:text-xl font-bold mb-6 text-zinc-100 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Deploy Assessment
                  </h2>
                  
                  {/* Deployment Mode Toggle */}
                  <div className="flex space-x-2 mb-6 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                    <button 
                      onClick={() => setFormData({...formData, testType: 'mcq'})} 
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.testType === 'mcq' ? 'bg-zinc-800 text-zinc-100 shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      MCQ Matrix
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, testType: 'descriptive'})} 
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.testType === 'descriptive' ? 'bg-zinc-800 text-zinc-100 shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      Case Study
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="text" placeholder="Title" value={formData.title} className="w-full p-3 md:p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-sm md:text-base" onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                      <input type="text" placeholder="Subject" value={formData.subject} className="w-full p-3 md:p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-sm md:text-base" onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                      <input type="number" placeholder="Mins" min="1" value={formData.duration} className="w-full p-3 md:p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-sm md:text-base" onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })} required />
                    </div>

                    <div className="mb-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Schedule Deployment (Optional - IST)</label>
                      <input 
                        type="datetime-local" 
                        value={formData.scheduledTime} 
                        className="w-full p-3 md:p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-sm md:text-base [color-scheme:dark]" 
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })} 
                      />
                    </div>

                    {/* Conditional UI for Case Study Mode */}
                    {formData.testType === 'descriptive' && (
                      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Maximum Marks</label>
                          <input type="number" placeholder="Total marks for this case study" min="1" value={formData.maxMarks} className="w-full p-3 md:p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-all text-sm md:text-base" onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })} required />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Case Study Document</label>
                          <textarea placeholder="Paste the full case study text here..." rows={6} value={formData.caseStudyText} className="w-full p-3 md:p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-rose-500 transition-all text-sm" onChange={(e) => setFormData({ ...formData, caseStudyText: e.target.value })} required />
                        </div>
                      </div>
                    )}

                    <textarea 
                      placeholder={formData.testType === 'mcq' ? "Paste MCQ JSON Array here..." : 'Paste Questions JSON Array here...\ne.g. [\n  "Analyze the current market strategy.",\n  "How does this affect overall ROI?"\n]'} 
                      rows={formData.testType === 'mcq' ? 8 : 4} 
                      value={formData.jsonQuestions} 
                      className="w-full p-3 md:p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-rose-200/80 placeholder-zinc-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono text-xs md:text-sm transition-all" 
                      onChange={(e) => setFormData({ ...formData, jsonQuestions: e.target.value })} 
                      required 
                    />
                    
                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-rose-600 to-orange-500 text-white p-4 rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.01] transition-transform shadow-[0_0_20px_rgba(225,29,72,0.15)] disabled:opacity-50 disabled:scale-100">
                      {isLoading ? 'Encrypting Payload...' : formData.scheduledTime ? 'Schedule Protocol' : 'Deploy Protocol Live'}
                    </button>

                    {message && (
                      <div className={`p-4 rounded-xl text-center font-mono text-xs md:text-sm uppercase tracking-wide border ${message.includes('success') || message.includes('mainframe') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {message}
                      </div>
                    )}
                  </form>
                </div>

                {/* Evaluation Queue Component */}
                <div className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl border border-purple-500/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  <h2 className="text-lg md:text-xl font-bold mb-6 text-purple-400 uppercase tracking-widest flex items-center">
                    Evaluation Queue
                    {pendingEvaluations.length > 0 && <span className="ml-3 bg-purple-500 text-zinc-950 text-xs px-2 py-0.5 rounded-full font-black">{pendingEvaluations.length}</span>}
                  </h2>
                  {pendingEvaluations.length === 0 ? (
                    <p className="text-zinc-600 text-sm font-medium">No subjective transmissions pending review.</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingEvaluations.map((evalItem: any) => (
                        <div key={evalItem._id} className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                          <div>
                            <p className="font-bold text-zinc-200">{evalItem.testId?.title || 'Unknown Protocol'}</p>
                            <p className="text-xs text-zinc-500 font-mono mt-1">Agent: {evalItem.userId?.name || evalItem.userId?.email}</p>
                          </div>
                          <button onClick={() => router.push(`/evaluate/${evalItem._id}`)} className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-purple-500 hover:text-zinc-950 transition-all">
                            Review
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {pendingUsers.length > 0 && (
                  <div className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl border border-amber-500/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <h2 className="text-lg md:text-xl font-bold mb-6 text-amber-400 uppercase tracking-widest flex items-center">
                      Security Clearance
                      <span className="ml-3 bg-amber-500 text-zinc-950 text-xs px-2 py-0.5 rounded-full font-black">{pendingUsers.length}</span>
                    </h2>
                    <div className="space-y-3">
                      {pendingUsers.map((user: any) => (
                        <div key={user._id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 gap-4 sm:gap-0">
                          <div>
                            <p className="font-bold text-zinc-200">{user.name}</p>
                            <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => handleUserAction(user._id, 'approve')} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-500 hover:text-zinc-950 transition-all">Grant</button>
                            <button onClick={() => handleUserAction(user._id, 'reject')} className="flex-1 sm:flex-none px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all">Deny</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-zinc-100 uppercase tracking-widest">Personal Archives</h2>
              {myHistory.length === 0 ? (
                <p className="text-zinc-600 text-sm font-medium">No recorded missions yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myHistory.map((sub: any) => (
                    <div key={sub._id} className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/40 hover:border-zinc-600 transition-colors flex justify-between items-center group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div className="pl-2">
                        <h3 className="font-bold text-zinc-200 truncate pr-2">{sub.testId?.title || 'Unknown Test'}</h3>
                        <p className="text-xs text-zinc-500 mt-1 font-mono uppercase">
                          {
                           sub.status === 'pending' ? <span className="text-purple-400 font-bold">Pending Review</span> : `Score: ${sub.score} / ${sub.totalQuestions}`
                          }
                        </p>
                      </div>
                      <button onClick={() => router.push(`/review/${sub._id}`)} className="px-3 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 hover:text-white transition-all">
                        Log
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl h-[300px] md:h-[350px] overflow-y-auto custom-scrollbar">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-zinc-100 uppercase tracking-widest">Live Network</h2>
              {archive.length === 0 ? (
                <p className="text-zinc-600 text-sm font-medium">No transmissions found.</p>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {archive.map((test: any) => {
                    const isScheduled = test.startTime && new Date(test.startTime).getTime() > Date.now();
                    const isDescriptive = test.testType === 'descriptive'; 
                    
                    return (
                    <div key={test._id} className={`p-4 border rounded-xl transition-colors flex justify-between items-center group relative overflow-hidden ${isScheduled ? 'border-amber-500/20 bg-zinc-950/40' : 'border-zinc-800 bg-zinc-950/40 hover:border-rose-500/50'}`}>
                      <div className={`absolute top-0 left-0 w-1 h-full ${isScheduled ? 'bg-amber-500' : isDescriptive ? 'bg-purple-500' : 'bg-rose-500'} ${isScheduled ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}></div>
                      <div className="pr-4">
                        <h3 className="font-bold text-zinc-200 line-clamp-1">{test.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wide">
                          {isScheduled ? <span className="text-amber-400 font-bold text-[10px] md:text-xs">Scheduled</span> : `${test.subject} • ${test.duration}m`}
                          {isDescriptive && <span className="ml-2 text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">CASE</span>}
                        </p>
                      </div>
                      <button onClick={() => router.push(`/test/${test._id}`)} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shrink-0 ${isScheduled ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-zinc-950' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white'}`}>
                        {isScheduled ? 'Standby' : 'Enter'}
                      </button>
                    </div>
                  )})}
                </div>
              )}
            </div>

            {/* SPLIT LEADERBOARD UI */}
            <div className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl space-y-8">
              <div>
                <h2 className="text-sm md:text-base font-bold text-rose-500 mb-1 uppercase tracking-widest">Recent Standings</h2>
                <p className="text-xs text-zinc-500 font-mono mb-4 border-b border-zinc-800 pb-3 line-clamp-1">{recentTitle}</p>
                <div className="space-y-2">
                  {recentLeaderboard.length === 0 ? (
                    <p className="text-zinc-600 text-sm font-medium italic">Data expunged or missing.</p>
                  ) : (
                    recentLeaderboard.map((user: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-zinc-950/30 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]' : 'text-zinc-600'}`}>#{i + 1}</span>
                          <span className="text-sm font-medium text-zinc-300">{user.name}</span>
                        </div>
                        <span className="text-sm font-bold text-rose-400">{user.score} <span className="text-xs text-zinc-600">/ {user.total}</span></span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm md:text-base font-bold text-orange-400 mb-4 border-b border-zinc-800 pb-3 uppercase tracking-widest">Overall Vanguard</h2>
                <div className="space-y-2">
                  {overallLeaderboard.length === 0 ? (
                    <p className="text-zinc-600 text-sm font-medium italic">No global records established.</p>
                  ) : (
                    overallLeaderboard.map((user: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-zinc-950/30 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'text-zinc-600'}`}>#{i + 1}</span>
                          <span className="text-sm font-medium text-zinc-300">{user.name}</span>
                        </div>
                        <span className="text-sm font-bold text-orange-400">{user.score} <span className="text-xs text-zinc-600 uppercase tracking-widest">pts</span></span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}