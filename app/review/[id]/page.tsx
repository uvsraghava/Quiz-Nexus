'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { status } = useSession();

  const [reviewData, setReviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      if (status !== 'authenticated') return;
      try {
        const res = await fetch(`/api/submissions/${id}`);
        if (res.ok) {
          const data = await res.json();
          setReviewData(data);
        }
      } catch (error) {
        console.error("Failed to fetch review data");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchReview();
  }, [id, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-rose-500 flex items-center justify-center animate-pulse font-mono uppercase tracking-widest text-sm md:text-base">
        Retrieving Mission Logs...
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-rose-500 flex items-center justify-center font-black uppercase tracking-widest text-sm md:text-base text-center p-4">
        Failed to decrypt assessment records.
      </div>
    );
  }

  const { test, submission } = reviewData;

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-200 p-4 md:p-8 font-sans selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 border-b border-zinc-800/80 pb-6 mt-4 md:mt-6 gap-4 md:gap-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
              After-Action Report
            </h1>
            <p className="text-zinc-400 mt-2 font-mono uppercase tracking-wide text-xs md:text-sm">
              {test.title} • {test.subject}
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full md:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors font-bold uppercase tracking-widest text-xs md:text-sm shadow-lg text-zinc-300"
          >
            ← Return to Base
          </button>
        </div>

        {/* QUESTIONS LOOP */}
        <div className="space-y-6 md:space-y-8">
          {test.questions.map((q: any, index: number) => {
            // Safely check if answers exist before trying to read the index
            const selectedAnswer = submission.answers ? submission.answers[index] : null;
            const isCorrect = selectedAnswer === q.correctAnswer;

            return (
              <div key={index} className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl relative overflow-hidden">
                
                {/* Accent Bar */}
                <div className={`absolute top-0 left-0 w-1 h-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                
                {/* Question Status Header */}
                <div className="flex items-start justify-between mb-4 md:mb-6 border-b border-zinc-800/50 pb-4">
                  <h2 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest">
                    Parameter {index + 1}
                  </h2>
                  {isCorrect ? (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg">Match</span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg">Mismatch</span>
                  )}
                </div>
                
                <p className="text-lg md:text-xl text-zinc-100 leading-relaxed mb-6 font-medium">
                  {q.questionText}
                </p>

                {/* Options List */}
                <div className="space-y-3 md:space-y-4">
                  {q.options.map((option: string, optIndex: number) => {
                    const isSelected = selectedAnswer === option;
                    const isActualCorrect = q.correctAnswer === option;
                    
                    // Default styling (Gray/Inactive)
                    let optionStyle = "bg-zinc-950/50 border-zinc-800 text-zinc-400";
                    let badge = null;

                    if (isSelected && isActualCorrect) {
                      // Status: Selected & Correct
                      optionStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                      badge = <span className="text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-wider shrink-0 mt-3 md:mt-0">✓ Verified</span>;
                    } else if (isSelected && !isActualCorrect) {
                      // Status: Selected & Incorrect
                      optionStyle = "bg-rose-500/10 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.1)]";
                      badge = <span className="text-rose-400 text-[10px] md:text-xs font-black uppercase tracking-wider shrink-0 mt-3 md:mt-0">✗ Invalid</span>;
                    } else if (!isSelected && isActualCorrect) {
                      // Status: Not Selected, but is the Correct Answer
                      optionStyle = "bg-emerald-950/30 border-emerald-500/50 text-emerald-400 border-dashed border-2";
                      badge = <span className="text-emerald-500 text-[10px] md:text-xs font-black uppercase tracking-wider shrink-0 mt-3 md:mt-0">Expected Option</span>;
                    }

                    return (
                      <div 
                        key={optIndex} 
                        className={`w-full text-left p-4 md:p-5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center transition-all ${optionStyle}`}
                      >
                        <div className="flex items-start md:items-center pr-0 md:pr-4">
                          <span className={`inline-flex items-center justify-center shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full border text-center font-mono text-xs md:text-sm mr-3 md:mr-4 ${
                            isSelected || isActualCorrect ? 'border-current bg-black/20' : 'border-zinc-700 bg-zinc-900'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="font-medium text-sm md:text-[15px] leading-relaxed mt-0.5 md:mt-0">{option}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                  
                  {/* Warning if the user completely skipped/ran out of time on this question */}
                  {!selectedAnswer && (
                    <div className="mt-4 text-xs md:text-sm text-amber-400 bg-amber-500/10 p-3 md:p-4 rounded-xl border border-amber-500/20 font-medium uppercase tracking-wide">
                      ⚠ Data Not Found: Parameter left blank.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}