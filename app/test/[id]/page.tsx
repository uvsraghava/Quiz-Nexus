'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function TestTakingInterface() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [test, setTest] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // UPGRADED: 'any' typing to accommodate strings (descriptive) and string[] (MCQ)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: any }>({});
  
  const [markedForReview, setMarkedForReview] = useState<{ [key: number]: boolean }>({});
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState<number>(0);

  const [resultState, setResultState] = useState<{score: number, total: number} | null>(null);

  useEffect(() => {
    const fetchTestAndStatus = async () => {
      if (status !== 'authenticated' || !session?.user?.email) return;

      try {
        const subRes = await fetch(`/api/submissions?testId=${id}&email=${session.user.email}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData.hasTaken) {
            setAlreadyTaken(true);
            return; 
          }
        }

        const res = await fetch(`/api/tests/${id}`);
        if (res.ok) {
          const serverDateHeader = res.headers.get('date');
          const currentServerTime = serverDateHeader ? new Date(serverDateHeader).getTime() : Date.now();
          const offset = currentServerTime - Date.now();
          setServerTimeOffset(offset);

          const data = await res.json();
          
          if (data.startTime) {
            const startTimestamp = new Date(data.startTime).getTime();
            if (startTimestamp > currentServerTime) {
              setIsLocked(true);
              setLockCountdown(Math.floor((startTimestamp - currentServerTime) / 1000));
            }
          }

          setTest(data);
          setTimeLeft(data.duration * 60);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    if (id) fetchTestAndStatus();
  }, [id, session, status]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && test && !isLocked && !alreadyTaken && !isSubmitting && !resultState) {
        submitTest();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [test, isLocked, alreadyTaken, isSubmitting, resultState, selectedAnswers, id, session]); 

  useEffect(() => {
    if (!isLocked || lockCountdown <= 0) {
      if (isLocked && lockCountdown <= 0) setIsLocked(false);
      return;
    }
    const timerId = setInterval(() => setLockCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [isLocked, lockCountdown]);

  useEffect(() => {
    if (isLocked || timeLeft === null || timeLeft <= 0 || alreadyTaken) {
      if (!isLocked && timeLeft === 0 && !isSubmitting && !alreadyTaken && !resultState) submitTest();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => (prev ? prev - 1 : 0)), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, alreadyTaken, isLocked]);

  // UPGRADED: Silent array toggling for MCQ, string preserving for Descriptive
  const handleSelectAnswer = (value: string) => {
    if (test?.testType === 'descriptive') {
      setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: value }));
    } else {
      setSelectedAnswers(prev => {
        const currentSelected = (prev[currentQuestionIndex] as string[]) || [];
        if (currentSelected.includes(value)) {
          return { ...prev, [currentQuestionIndex]: currentSelected.filter(v => v !== value) };
        } else {
          return { ...prev, [currentQuestionIndex]: [...currentSelected, value] };
        }
      });
    }
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }));
  };

  const submitTest = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: id, userEmail: session?.user?.email, answers: selectedAnswers })
      });
      const data = await res.json();
      if (res.ok) setResultState({ score: data.score, total: data.total });
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };


  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 text-rose-500 flex items-center justify-center font-mono uppercase tracking-widest text-sm md:text-base animate-pulse">
        Authenticating...
      </div>
    );
  }

  if (resultState) {
    const isPending = test?.testType === 'descriptive';
    
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-4">
        <div className={`bg-zinc-900 p-8 md:p-10 rounded-3xl border border-zinc-800 text-center max-w-md w-full shadow-2xl ${isPending ? 'shadow-purple-500/10' : 'shadow-rose-500/10'}`}>
          <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r ${isPending ? 'from-purple-400 to-fuchsia-500' : 'from-orange-400 to-rose-500'}`}>
            {isPending ? 'Data Transmitted' : 'Mission Accomplished'}
          </h2>
          <p className="text-zinc-500 mb-8 font-medium text-sm md:text-base">
            {isPending ? 'Your subjective responses have been routed to Command for manual evaluation.' : 'Your data has been transmitted securely.'}
          </p>
          
          {isPending ? (
            <div className="text-xl md:text-2xl font-black text-purple-500 mb-8 font-mono drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] uppercase tracking-widest border border-purple-500/20 bg-purple-500/10 py-4 rounded-xl">
              Pending Review
            </div>
          ) : (
            <div className="text-5xl md:text-6xl font-black text-rose-500 mb-8 font-mono drop-shadow-[0_0_15px_rgba(225,29,72,0.4)]">
              {resultState.score} <span className="text-2xl md:text-3xl text-zinc-600">/ {resultState.total}</span>
            </div>
          )}

          <button onClick={() => router.push('/dashboard')} className={`w-full text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs md:text-sm hover:scale-[1.02] ${isPending ? 'bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-gradient-to-r from-rose-600 to-orange-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]'}`}>
            Return to Command Center
          </button>
        </div>
      </div>
    );
  }

  if (alreadyTaken) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 p-8 md:p-10 rounded-2xl border border-zinc-800 text-center max-w-md w-full shadow-2xl">
          <div className="text-5xl text-rose-500 mb-4 font-black">X</div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest mb-2">Access Denied</h2>
          <p className="text-zinc-400 mb-8 text-sm md:text-base font-medium">Record already exists. Multiple attempts are locked.</p>
          <button onClick={() => router.push('/dashboard')} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 md:py-4 rounded-xl transition-colors uppercase tracking-widest text-xs md:text-sm">
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-orange-400 animate-pulse font-mono uppercase tracking-widest text-sm md:text-base">
        Initializing Matrix...
      </div>
    );
  }

  if (isLocked) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-200 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="w-20 h-20 mb-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest mb-4 text-amber-400 z-10">Protocol Locked</h2>
      <p className="text-zinc-500 font-mono text-sm md:text-base max-w-md leading-relaxed mb-8 z-10">This assessment is scheduled for a future deployment. Decryption keys will automatically release at network zero hour.</p>
      <div className="text-6xl md:text-8xl font-black font-mono text-zinc-100 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] z-10 tracking-tighter">
        {formatTime(lockCountdown)}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-amber-500/50 z-10">T-Minus to Synchronization (IST)</p>
    </div>
  );

  const currentQuestion = test.questions[currentQuestionIndex];
  const isDescriptive = test.testType === 'descriptive';

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-100 p-4 md:p-6 font-sans selection:bg-rose-500/30">
      
      <div className={`${isDescriptive ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto flex justify-between items-center mb-6 md:mb-8 relative transition-all`}>
        <h1 className={`text-xl md:text-2xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${isDescriptive ? 'from-purple-500 to-fuchsia-400' : 'from-rose-500 to-orange-400'}`}>
          {isDescriptive ? 'Case Nexus' : 'Quiz Nexus'}
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 md:space-x-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 md:px-3 py-2 rounded-full transition-colors">
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-black text-white ${isDescriptive ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500' : 'bg-gradient-to-br from-rose-500 to-orange-500'}`}>
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-xs md:text-sm font-medium pr-2 hidden sm:block">{session?.user?.name || 'Profile'}</span>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 md:w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
              <div className="p-4 border-b border-zinc-800">
                <p className="text-sm font-bold text-white truncate">{session?.user?.name}</p>
                <p className="text-xs text-zinc-500 truncate mt-1">{session?.user?.email}</p>
              </div>
              <div className="p-2">
                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-4 py-3 text-xs md:text-sm font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">Log Out</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`${isDescriptive ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 transition-all`}>
        
        <div className={`w-full flex flex-col gap-6 ${isDescriptive ? 'lg:w-1/2' : 'flex-1'}`}>
          
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/40 backdrop-blur-xl p-5 md:p-6 rounded-2xl border shadow-xl gap-4 md:gap-0 ${isDescriptive ? 'border-purple-500/20' : 'border-zinc-800/50'}`}>
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-100 pr-2">{test.title}</h1>
              <p className={`mt-1 font-mono text-xs md:text-sm uppercase ${isDescriptive ? 'text-fuchsia-400' : 'text-orange-400'}`}>
                {test.subject} {isDescriptive && `| Max Marks: ${test.maxMarks}`}
              </p>
            </div>
            <div className="hidden md:block text-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 shrink-0">
              <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest mb-1">Time Remaining</p>
              <p className={`text-3xl md:text-4xl font-mono font-black ${timeLeft && timeLeft < 60 ? 'text-rose-500 animate-pulse drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]' : 'text-zinc-200'}`}>
                {timeLeft !== null ? formatTime(timeLeft) : '00:00'}
              </p>
            </div>
          </div>

          {isDescriptive && test.caseStudyText && (
             <div className="bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-purple-500/20 shadow-2xl relative flex-1 min-h-[500px]">
               <h2 className="text-xs md:text-sm font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-purple-500/20 pb-3">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                 Reference Document
               </h2>
               <div className="prose prose-invert max-w-none text-zinc-300 font-sans leading-relaxed text-sm md:text-base whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {test.caseStudyText}
               </div>
             </div>
          )}

          {!isDescriptive && (
            <>
              <div className="bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }} />
                </div>
                <div className="flex justify-between items-start mt-2 md:mt-4 mb-4 md:mb-6">
                  <h2 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest">
                    Parameter {currentQuestionIndex + 1} of {test.questions.length}
                  </h2>
                  <button onClick={toggleMarkForReview} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border ${markedForReview[currentQuestionIndex] ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-zinc-950/50 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
                    {markedForReview[currentQuestionIndex] ? '★ Flagged' : '☆ Mark for Review'}
                  </button>
                </div>
                <p className="text-lg md:text-xl text-zinc-100 leading-relaxed mb-6 md:mb-8 font-medium">
                  {currentQuestion.questionText}
                </p>
                <div className="space-y-3 md:space-y-4">
                  {currentQuestion.options.map((option: string, idx: number) => {
                    // UPGRADED: Checking inclusion within the array
                    const isSelected = (selectedAnswers[currentQuestionIndex] || []).includes(option);
                    return (
                      <button key={idx} onClick={() => handleSelectAnswer(option)} className={`w-full text-left p-4 md:p-5 rounded-xl border flex items-start md:items-center transition-all duration-200 ${isSelected ? 'bg-rose-950/40 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(225,29,72,0.15)]' : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}>
                        <span className={`inline-flex items-center justify-center shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full border text-center font-mono text-xs md:text-sm mr-3 md:mr-4 mt-0.5 md:mt-0 ${isSelected ? 'border-rose-500 bg-rose-500/20 text-rose-300' : 'border-zinc-700 bg-zinc-900'}`}>{String.fromCharCode(65 + idx)}</span>
                        <span className="font-medium text-sm md:text-[15px] leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center pb-12 gap-4">
                <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="px-5 md:px-6 py-3 md:py-4 bg-zinc-900 text-zinc-400 font-bold uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  ← Previous
                </button>
                {currentQuestionIndex === test.questions.length - 1 ? (
                  <button onClick={submitTest} disabled={isSubmitting} className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-rose-600 to-orange-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(225,29,72,0.2)] disabled:opacity-50 disabled:scale-100">
                    {isSubmitting ? 'Transmitting...' : 'Finish & Transmit'}
                  </button>
                ) : (
                  <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="px-8 md:px-10 py-3 md:py-4 bg-zinc-100 text-zinc-950 font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:bg-white transition-colors shadow-lg">
                    Next Step →
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className={`w-full shrink-0 flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start ${isDescriptive ? 'lg:w-1/2' : 'lg:w-80'}`}>
          
          <div className="md:hidden flex justify-between items-center bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Time Remaining</span>
            <span className={`text-2xl font-mono font-black ${timeLeft && timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-zinc-200'}`}>{timeLeft !== null ? formatTime(timeLeft) : '00:00'}</span>
          </div>

          {isDescriptive && (
            <div className="flex flex-col gap-6">
              <div className="bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl relative overflow-hidden flex-1">
                <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-600 transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }} />
                </div>
                
                <div className="flex justify-between items-start mt-2 md:mt-4 mb-4 md:mb-6">
                  <h2 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest">
                    Parameter {currentQuestionIndex + 1} of {test.questions.length}
                  </h2>
                  <button onClick={toggleMarkForReview} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border ${markedForReview[currentQuestionIndex] ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'bg-zinc-950/50 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
                    {markedForReview[currentQuestionIndex] ? '★ Flagged' : '☆ Mark for Review'}
                  </button>
                </div>

                <p className="text-lg md:text-xl text-zinc-100 leading-relaxed mb-6 md:mb-8 font-medium">
                  {currentQuestion.questionText}
                </p>

                <textarea
                  value={selectedAnswers[currentQuestionIndex] || ''}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  placeholder="Enter your analysis here. Paragraphs and bullet points are logged securely..."
                  className="w-full h-64 md:h-[40vh] p-4 md:p-5 rounded-xl border bg-zinc-950/80 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-sans text-sm md:text-base leading-relaxed resize-y custom-scrollbar"
                />
              </div>

              <div className="flex justify-between items-center pb-12 gap-4">
                <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="px-5 md:px-6 py-3 md:py-4 bg-zinc-900 text-zinc-400 font-bold uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  ← Previous
                </button>
                {currentQuestionIndex === test.questions.length - 1 ? (
                  <button onClick={submitTest} disabled={isSubmitting} className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-50 disabled:scale-100">
                    {isSubmitting ? 'Transmitting...' : 'Finish & Transmit'}
                  </button>
                ) : (
                  <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="px-8 md:px-10 py-3 md:py-4 bg-zinc-100 text-zinc-950 font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:bg-white transition-colors shadow-lg">
                    Next Step →
                  </button>
                )}
              </div>
            </div>
          )}

          {!isDescriptive && (
            <div className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-6 rounded-2xl border border-zinc-800/50 shadow-2xl">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-800/80 pb-3">Matrix Navigator</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700 shrink-0"></div><span className="text-[9px] md:text-[10px] uppercase text-zinc-500 font-bold leading-tight">Pending</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500 shrink-0"></div><span className="text-[9px] md:text-[10px] uppercase text-zinc-500 font-bold leading-tight">Secured</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500 shrink-0"></div><span className="text-[9px] md:text-[10px] uppercase text-zinc-500 font-bold leading-tight">Flagged</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-500 shrink-0"></div><span className="text-[9px] md:text-[10px] uppercase text-zinc-500 font-bold leading-tight">Secured+Flag</span></div>
              </div>
              <div className="grid grid-cols-5 gap-2 md:gap-3">
                {test.questions.map((_: any, i: number) => {
                  // UPGRADED: Proper Matrix indication based on array lengths
                  const isAnswered = isDescriptive 
                    ? !!selectedAnswers[i] 
                    : (Array.isArray(selectedAnswers[i]) && selectedAnswers[i].length > 0);
                  const isFlagged = !!markedForReview[i];
                  const isActive = currentQuestionIndex === i;
                  let btnStyle = "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500";
                  if (isAnswered && !isFlagged) btnStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20";
                  if (!isAnswered && isFlagged) btnStyle = "bg-amber-500/10 border-amber-500/50 text-amber-400 hover:bg-amber-500/20";
                  if (isAnswered && isFlagged) btnStyle = "bg-purple-500/10 border-purple-500/50 text-purple-400 hover:bg-purple-500/20";
                  const activeRing = isActive ? "ring-2 ring-zinc-200 ring-offset-2 ring-offset-zinc-950 scale-110 z-10" : "";
                  return (
                    <button key={i} onClick={() => setCurrentQuestionIndex(i)} className={`h-10 md:h-12 flex items-center justify-center rounded-lg border font-mono text-xs md:text-sm font-black transition-all ${btnStyle} ${activeRing}`}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}