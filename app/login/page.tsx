'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added for cinematic loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isRegistering) {
      // Handle Registration
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setIsRegistering(false);
        setError('Clearance requested successfully! Awaiting Admin approval.');
        setIsLoading(false);
      } else {
        const data = await res.json();
        setError(data.message || 'Registration failed');
        setIsLoading(false);
      }
    } else {
      // Handle Login
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
      
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <form 
        onSubmit={handleSubmit} 
        className="relative z-10 p-8 md:p-10 bg-zinc-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800/60 transition-all duration-500 hover:border-zinc-700/80"
      >
        <h2 className="text-3xl md:text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 text-center uppercase tracking-tighter">
          {isRegistering ? 'Initialization' : 'System Login'}
        </h2>
        
        {error && (
          <div className={`mb-6 text-xs md:text-sm font-bold text-center p-3 md:p-4 rounded-xl border uppercase tracking-widest animate-pulse ${error.includes('successfully') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Animated expansion for the Name field */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isRegistering ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
            <input
              type="text"
              placeholder="Agent Designation (Full Name)"
              className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono text-sm"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required={isRegistering}
            />
          </div>
          
          <input
            type="email"
            placeholder="Comm-Link (Email Address)"
            className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono text-sm"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Decryption Key (Password)"
            className="w-full p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono text-sm"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="mt-8 w-full bg-gradient-to-r from-rose-600 to-orange-500 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(225,29,72,0.2)] disabled:opacity-50 disabled:scale-100 flex justify-center items-center h-14"
        >
          {isLoading ? (
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            isRegistering ? 'Register Credentials' : 'Access Network'
          )}
        </button>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-[10px] md:text-xs text-zinc-500 hover:text-rose-400 font-bold uppercase tracking-widest transition-colors duration-300"
          >
            {isRegistering ? 'Already possess a comm-link? Sign In' : 'Request security clearance? Register'}
          </button>
        </div>
      </form>
    </div>
  );
}