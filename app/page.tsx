import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 text-zinc-200 overflow-hidden relative selection:bg-rose-500/30">
      
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000"></div>

      <div className="text-center z-10 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 drop-shadow-[0_0_20px_rgba(225,29,72,0.3)]">
          Quiz Nexus
        </h1>
        <p className="text-sm md:text-lg lg:text-xl mb-12 text-zinc-400 font-mono uppercase tracking-[0.2em] md:tracking-[0.3em]">
          The official CCB Study Group
        </p>
        
        <div className="flex justify-center group mt-4">
          <Link 
            href="/login" 
            className="relative inline-flex items-center justify-center px-10 py-4 font-black uppercase tracking-widest text-zinc-100 transition-all duration-300 ease-out bg-zinc-900/80 rounded-xl hover:bg-zinc-900 border border-zinc-800 hover:border-rose-500 hover:text-white hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:scale-105 overflow-hidden backdrop-blur-md"
          >
            {/* Sweeping light animation on hover */}
            <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-64 ease-out"></span>
            Access Platform
          </Link>
        </div>
      </div>
    </div>
  );
}