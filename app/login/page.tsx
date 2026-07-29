'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  
  // NEW: State for the Forgot Password flow
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (authMode === 'register') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setAuthMode('login');
        setError('Clearance requested successfully! Awaiting Admin approval.');
      } else {
        const data = await res.json();
        setError(data.message || 'Registration failed');
      }
      setIsLoading(false);

    } else if (authMode === 'forgot') {
      // FORGOT PASSWORD LOGIC
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      if (res.ok) {
        setError('Recovery link transmitted. Check your comm-link (email).');
        setAuthMode('login');
      } else {
        setError('Failed to locate email in the mainframe.');
      }
      setIsLoading(false);

    } else {
      const res = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-200 p-4 selection:bg-rose-500/30">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <form onSubmit={handleSubmit} className="relative z-10 p-8 md:p-10 bg-zinc-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800/60 transition-all duration-500 hover:border-zinc-700/80">
        <h2 className="text-3xl md:text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 text-center uppercase tracking-tighter">
          {authMode === 'register' ? 'Initialization' : authMode === 'forgot' ? 'Recovery' : 'System Login'}
        </h2>
        
        {error && (
          <div className={`mb-6 text-xs md:text-sm font-bold text-center p-3 md:p-4 rounded-xl border uppercase tracking-widest animate-pulse ${error.includes('success') || error.includes('transmitted') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${authMode === 'register' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
            <input type="text" placeholder="Agent Designation (Full Name)" className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-all font-mono text-sm" onChange={(e) => setFormData({ ...formData, name: e.target.value })} required={authMode === 'register'} />
          </div>
          
          <input type="email" placeholder="Comm-Link (Email Address)" className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-all font-mono text-sm" onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${authMode !== 'forgot' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
            <input type="password" placeholder="Decryption Key (Password)" className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-all font-mono text-sm" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={authMode !== 'forgot'} />
          </div>
        </div>
        
        <button type="submit" disabled={isLoading} className="mt-8 w-full bg-gradient-to-r from-rose-600 to-orange-500 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(225,29,72,0.2)] disabled:opacity-50 disabled:scale-100 flex justify-center items-center h-14">
          {isLoading ? 'Transmitting...' : authMode === 'register' ? 'Register Credentials' : authMode === 'forgot' ? 'Transmit Reset Link' : 'Access Network'}
        </button>
        
        <div className="mt-6 flex flex-col items-center gap-3">
          {authMode === 'login' && (
            <button type="button" onClick={() => { setAuthMode('forgot'); setError(''); }} className="text-[10px] md:text-xs text-rose-500/80 hover:text-rose-400 font-bold uppercase tracking-widest transition-colors duration-300">
              Forgot Decryption Key?
            </button>
          )}
          <button type="button" onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setError(''); }} className="text-[10px] md:text-xs text-zinc-500 hover:text-orange-400 font-bold uppercase tracking-widest transition-colors duration-300">
            {authMode === 'register' ? 'Already possess a comm-link? Sign In' : 'Request security clearance? Register'}
          </button>
        </div>
      </form>
    </div>
  );
}