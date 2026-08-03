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
  const isDescriptive = test.testType === 'descriptive';
  const isPending = submission.status === 'pending';

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-200 p-4 md:p-8 font-sans selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 border-b border-zinc-800/80 pb-6 mt-4 md:mt-6 gap-4 md:gap-0">
          <div>
            <h1 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${isDescriptive ? 'from-purple-500 to-fuchsia-400' : 'from-orange-400 to-rose-500'}`}>
              After-Action Report
            </h1>
            <p className="text-zinc-400 mt-2 font-mono uppercase tracking-wide text-xs md:text-sm">
              {test.title} • {test.subject} | Type: {isDescriptive ? 'Case Study' : 'MCQ Protocol'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Score / Status Badge */}
            <div className={`px-6 py-2 rounded-xl border ${isPending ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-100'}`}>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-0.5">
                {isPending ? 'Status' : 'Final Score'}
              </p>
              <p className="text-xl font-black font-mono">
                {isPending ? 'PENDING' : `${submission.score} / ${submission.totalQuestions}`}
              </p>
            </div>

            <button 
              onClick={() => router.push('/dashboard')}
              className="flex-1 md:flex-none px-6 py-3 h-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors font-bold uppercase tracking-widest text-xs md:text-sm shadow-lg text-zinc-300"
            >
              ← Base
            </button>
          </div>
        </div>

        {/* CASE STUDY DOCUMENT LOG */}
        {isDescriptive && test.caseStudyText && (
          <div className="bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-purple-500/20 shadow-2xl mb-6 md:mb-8">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 border-b border-purple-500/20 pb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Reference Document (Case Study)
            </h3>
            <div className="prose prose-invert max-w-none text-zinc-300 font-sans leading-relaxed text-sm md:text-base whitespace-pre-wrap">
              {test.caseStudyText}
            </div>
          </div>
        )}

        {/* FEEDBACK MODULE */}
        {isDescriptive && !isPending && submission.feedback && (
          <div className="bg-purple-950/20 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 border-b border-purple-500/20 pb-3">
              Command Feedback
            </h3>
            <p className="text-purple-100 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {submission.feedback}
            </p>
          </div>
        )}

        {/* QUESTIONS LOOP */}
        <div className="space-y-6 md:space-y-8">
          {test.questions.map((q: any, index: number) => {
            const rawSelectedAnswer = submission.answers ? submission.answers[index] : null;
            
            // UPGRADED: Normalize everything into arrays for strict comparison
            const normalize = (val: any) => {
              if (!val) return [];
              return Array.isArray(val) ? val : [val];
            };

            const normUser = normalize(rawSelectedAnswer);
            const normCorrect = normalize(q.correctAnswer);

            // Determine overall question correctness (all-or-nothing matching)
            const isCorrect = !isDescriptive && 
                              normUser.length === normCorrect.length && 
                              normCorrect.every((val: string) => normUser.includes(val)) &&
                              normCorrect.length > 0;

            return (
              <div key={index} className={`bg-zinc-900/40 backdrop-blur-xl p-5 md:p-8 rounded-2xl border shadow-2xl relative overflow-hidden ${isDescriptive ? 'border-purple-500/20' : 'border-zinc-800/50'}`}>
                
                {/* Accent Bar (Only for MCQ) */}
                {!isDescriptive && (
                  <div className={`absolute top-0 left-0 w-1 h-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                )}
                
                {/* Question Status Header */}
                <div className="flex items-start justify-between mb-4 md:mb-6 border-b border-zinc-800/50 pb-4">
                  <h2 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest">
                    Parameter {index + 1}
                  </h2>
                  
                  {/* Status Badge (Only for MCQ) */}
                  {!isDescriptive && (
                    isCorrect ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg">Match</span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg">Mismatch</span>
                    )
                  )}
                </div>
                
                <p className="text-lg md:text-xl text-zinc-100 leading-relaxed mb-6 font-medium">
                  {q.questionText}
                </p>

                {/* --- DESCRIPTIVE MODE: Show Subjective Answer --- */}
                {isDescriptive ? (
                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {rawSelectedAnswer ? rawSelectedAnswer : <span className="italic text-zinc-600">No data submitted.</span>}
                  </div>
                ) : (
                  /* --- MCQ MODE: Array-based Options Logic --- */
                  <div className="space-y-3 md:space-y-4">
                    {q.options.map((option: string, optIndex: number) => {
                      
                      // UPGRADED: Check if the option exists within the normalized arrays
                      const isSelected = normUser.includes(option);
                      const isActualCorrect = normCorrect.includes(option);
                      
                      let optionStyle = "bg-zinc-950/50 border-zinc-800 text-zinc-400";
                      let badge = null;

                      if (isSelected && isActualCorrect) {
                        optionStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                        badge = <span className="text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-wider shrink-0 mt-3 md:mt-0">✓ Verified</span>;
                      } else if (isSelected && !isActualCorrect) {
                        optionStyle = "bg-rose-500/10 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.1)]";
                        badge = <span className="text-rose-400 text-[10px] md:text-xs font-black uppercase tracking-wider shrink-0 mt-3 md:mt-0">✗ Invalid</span>;
                      } else if (!isSelected && isActualCorrect) {
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
                    
                    {/* UPGRADED: Null check now looks at array length */}
                    {normUser.length === 0 && (
                      <div className="mt-4 text-xs md:text-sm text-amber-400 bg-amber-500/10 p-3 md:p-4 rounded-xl border border-amber-500/20 font-medium uppercase tracking-wide">
                        ⚠ Data Not Found: Parameter left blank.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}