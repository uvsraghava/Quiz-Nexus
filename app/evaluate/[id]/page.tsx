'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function EvaluationTerminal() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [submission, setSubmission] = useState<any>(null);
  const [score, setScore] = useState<number | ''>('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await fetch(`/api/evaluate?id=${id}&adminEmail=${session?.user?.email}`);
        if (res.ok) {
          const data = await res.json();
          setSubmission(data.submission);
        } else {
          setError('Failed to load transmission or unauthorized.');
        }
      } catch (err) {
        setError('Network error.');
      }
    };

    if (session?.user?.email && id) {
      fetchSubmission();
    }
  }, [id, session]);

  const handleEvaluate = async () => {
    const maxMarks = submission?.testId?.maxMarks || 100;
    if (score === '' || Number(score) < 0 || Number(score) > maxMarks) {
      setError(`Score must be between 0 and ${maxMarks}`);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: id,
          adminEmail: session?.user?.email,
          score: Number(score),
          feedback,
          maxMarks: maxMarks
        })
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError('Failed to submit evaluation.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || !submission) {
    return (
      <div className="min-h-screen bg-zinc-950 text-purple-500 flex items-center justify-center font-mono uppercase tracking-widest text-sm md:text-base animate-pulse">
        {error ? <span className="text-rose-500">{error}</span> : 'Decrypting Transmission...'}
      </div>
    );
  }

  const test = submission.testId;
  const user = submission.userId;
  const answers = submission.answers || {};

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-100 p-4 md:p-6 font-sans selection:bg-purple-500/30">
      
      {/* NAVBAR */}
      <div className="max-w-[1600px] mx-auto flex justify-between items-center mb-6 md:mb-8 relative">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-fuchsia-400">
          Evaluation Terminal
        </h1>
        <button 
          onClick={() => router.push('/dashboard')} 
          className="px-4 py-2 bg-zinc-900 text-zinc-400 font-bold uppercase tracking-widest text-xs rounded-xl border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          Abort & Return
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: Case Study Reference */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-zinc-900/40 backdrop-blur-xl p-5 md:p-6 rounded-2xl border border-purple-500/20 shadow-xl flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-100">{test.title}</h2>
              <p className="text-purple-400 mt-1 font-mono text-xs uppercase tracking-widest">
                Agent: {user.name} ({user.email})
              </p>
            </div>
            <div className="text-center bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
              <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1 font-bold">Max Marks</p>
              <p className="text-2xl font-mono font-black text-purple-300">{test.maxMarks}</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-zinc-800/50 shadow-2xl relative flex-1 min-h-[500px]">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800/80 pb-3">
              Reference Document
            </h2>
            <div className="prose prose-invert max-w-none text-zinc-400 font-sans leading-relaxed text-sm whitespace-pre-wrap max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
               {test.caseStudyText || 'No case study document provided.'}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Answers & Grading */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          
          {/* Answers Feed */}
          <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800/50 shadow-2xl max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/80 pb-3 sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10 pt-2">
              Agent Analysis Log
            </h2>
            
            {test.questions.map((q: any, i: number) => (
              <div key={i} className="space-y-3">
                <p className="text-sm text-purple-300 font-medium">Q{i + 1}: {q.questionText}</p>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {answers[i] ? answers[i] : <span className="text-zinc-600 italic">No response provided.</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Grading Panel */}
          <div className="bg-zinc-900/40 backdrop-blur-xl p-6 rounded-2xl border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            {error && <p className="text-rose-500 text-xs font-bold uppercase tracking-widest mb-4">{error}</p>}
            
            <div className="flex gap-4 mb-4">
              <div className="w-1/3">
                <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Final Score</label>
                <input 
                  type="number" 
                  min="0" 
                  max={test.maxMarks} 
                  value={score}
                  onChange={(e) => setScore(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-4 border border-purple-500/30 rounded-xl bg-purple-950/20 text-zinc-100 font-mono text-xl focus:outline-none focus:border-purple-500 transition-all text-center" 
                  placeholder="0"
                />
              </div>
              <div className="w-2/3">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Feedback (Optional)</label>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-300 text-sm focus:outline-none focus:border-purple-500 transition-all resize-none custom-scrollbar" 
                  placeholder="Enter remarks here..."
                  rows={2}
                />
              </div>
            </div>

            <button 
              onClick={handleEvaluate} 
              disabled={isSubmitting} 
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white p-4 rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.01] transition-transform shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Committing to Ledger...' : 'Finalize Grade & Transmit'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}