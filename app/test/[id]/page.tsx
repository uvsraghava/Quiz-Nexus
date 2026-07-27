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
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  
  // State to hold the final score
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
          const data = await res.json();
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
    if (timeLeft === null || timeLeft <= 0 || alreadyTaken) {
      if (timeLeft === 0 && !isSubmitting && !alreadyTaken) submitTest();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => (prev ? prev - 1 : 0)), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, alreadyTaken]);

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: option });
  };

  const submitTest = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: id,
          userEmail: session?.user?.email,
          answers: selectedAnswers
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Show the results screen instead of redirecting
        setResultState({ score: data.score, total: data.total });
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- RENDERING BLOCK ---

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 text-rose-500 flex items-center justify-center font-mono uppercase tracking-widest text-sm md:text-base animate-pulse">
        Authenticating...
      </div>
    );
  }

  // Results Screen Render
  if (resultState) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 p-8 md:p-10 rounded-3xl border border-zinc-800 text-center max-w-md w-full shadow-2xl shadow-rose-500/10">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
            Mission Accomplished
          </h2>
          <p className="text-zinc-500 mb-8 font-medium text-sm md:text-base">Your data has been transmitted securely.</p>
          
          <div className="text-5xl md:text-6xl font-black text-rose-500 mb-8 font-mono drop-shadow-[0_0_15px_rgba(225,29,72,0.4)]">
            {resultState.score} <span className="text-2xl md:text-3xl text-zinc-600">/ {resultState.total}</span>
          </div>

          <button onClick={() => router.push('/dashboard')} className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:scale-[1.02] text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs md:text-sm shadow-[0_0_20px_rgba(225,29,72,0.2)]">
            Return to Command Center
          </button>
        </div>
      </div>
    );
  }

  // Already Taken Render
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

  // Loading Test Matrix Render
  if (!test) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-orange-400 animate-pulse font-mono uppercase tracking-widest text-sm md:text-base">
        Initializing Matrix...
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-100 p-4 md:p-6 font-sans selection:bg-rose-500/30">
      
      {/* NAVBAR */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 md:mb-8 relative">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">
          Quiz Nexus
        </h1>
        <div>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)} 
            className="flex items-center space-x-2 md:space-x-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 md:px-3 py-2 rounded-full transition-colors"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full flex items-center justify-center text-xs md:text-sm font-black text-white">
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
                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-4 py-3 text-xs md:text-sm font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        {/* HEADER & TIMER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/40 backdrop-blur-xl p-5 md:p-6 rounded-2xl border border-zinc-800/50 shadow-xl gap-4 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-100 pr-2">{test.title}</h1>
            <p className="text-orange-400 mt-1 font-mono text-xs md:text-sm uppercase">{test.subject}</p>
          </div>
          <div className="w-full md:w-auto text-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 shrink-0">
            <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest mb-1">Time Remaining</p>
            <p className={`text-3xl md:text-4xl font-mono font-black ${timeLeft && timeLeft < 60 ? 'text-rose-500 animate-pulse drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]' : 'text-zinc-200'}`}>
              {timeLeft !== null ? formatTime(timeLeft) : '00:00'}
            </p>
          </div>
        </div>

        {/* QUESTION CARD */}
        <div className="bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-500" 
              style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }} 
            />
          </div>
          
          <div className="mt-2 md:mt-4">
            <h2 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 md:mb-6">
              Parameter {currentQuestionIndex + 1} of {test.questions.length}
            </h2>
            <p className="text-lg md:text-xl text-zinc-100 leading-relaxed mb-6 md:mb-8 font-medium">
              {currentQuestion.questionText}
            </p>
            
            {/* Options */}
            <div className="space-y-3 md:space-y-4">
              {currentQuestion.options.map((option: string, idx: number) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === option;
                return (
                  <button 
                    key={idx} 
                    onClick={() => handleSelectAnswer(option)} 
                    className={`w-full text-left p-4 md:p-5 rounded-xl border flex items-start md:items-center transition-all duration-200 ${
                      isSelected 
                        ? 'bg-rose-950/40 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(225,29,72,0.15)]' 
                        : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full border text-center font-mono text-xs md:text-sm mr-3 md:mr-4 mt-0.5 md:mt-0 ${
                      isSelected ? 'border-rose-500 bg-rose-500/20 text-rose-300' : 'border-zinc-700 bg-zinc-900'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-sm md:text-[15px] leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-between items-center pb-12 pt-2 gap-4">
          <button 
            disabled={currentQuestionIndex === 0} 
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)} 
            className="px-5 md:px-6 py-3 md:py-4 bg-zinc-900 text-zinc-400 font-bold uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          
          {currentQuestionIndex === test.questions.length - 1 ? (
            <button 
              onClick={submitTest} 
              disabled={isSubmitting} 
              className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-rose-600 to-orange-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(225,29,72,0.2)] disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Transmitting...' : 'Finish & Transmit'}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)} 
              className="px-8 md:px-10 py-3 md:py-4 bg-zinc-100 text-zinc-950 font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl hover:bg-white transition-colors shadow-lg"
            >
              Next Step →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}