'use client';

import { Loader } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-1.5 h-96 bg-gradient-to-b from-blue-500/20 to-transparent blur-md animate-pulse" style={{ top: '20%', left: '15%' }} />
        <div className="absolute w-1.5 h-96 bg-gradient-to-b from-purple-500/20 to-transparent blur-md animate-pulse" style={{ top: '20%', right: '15%' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <Loader className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Chargement en cours...</h2>
        <p className="text-slate-400 text-sm">Veuillez patienter</p>
      </div>
    </div>
  );
}
