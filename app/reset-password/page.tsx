'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setMessage('SUCCESS: Keys realigned. Redirecting to network gate...');
      setTimeout(() => router.push('/'), 2000);
    } else {
      setMessage('ERROR: Invalid or expired token.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-zinc-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800">
        <h2 className="text-2xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 uppercase">Override Key</h2>
        
        {message && <div className={`mb-6 text-xs p-3 border rounded-xl font-mono uppercase tracking-widest ${message.includes('SUCCESS') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{message}</div>}

        <input type="password" placeholder="New Decryption Key" className="w-full p-4 mb-6 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 font-mono text-sm focus:border-rose-500 focus:outline-none" onChange={(e) => setPassword(e.target.value)} required />
        
        <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-rose-600 to-orange-500 text-white p-4 rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] shadow-lg disabled:opacity-50">
          {isLoading ? 'Encrypting...' : 'Lock New Key'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-rose-500 flex items-center justify-center font-mono uppercase text-sm animate-pulse">Scanning Tokens...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}