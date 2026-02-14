
import React, { useState } from 'react';

interface Props {
  onHost: () => void;
  onJoin: (code: string) => void;
}

export const LandingPage: React.FC<Props> = ({ onHost, onJoin }) => {
  const [code, setCode] = useState('');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-indigo-600 tracking-tight">streekhook</h1>
        <p className="text-xl text-slate-500">Fast, fun, and easy quizzes for everyone!</p>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Game PIN"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-center text-4xl font-bold py-4 rounded-2xl border-4 border-slate-100 focus:border-indigo-500 outline-none transition-all tracking-widest uppercase"
          />
          <button
            onClick={() => onJoin(code)}
            disabled={!code}
            className="w-full bg-slate-900 text-white text-2xl font-bold py-4 rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
          >
            Join Game
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-400 font-bold uppercase tracking-wider">OR</span>
          </div>
        </div>

        <button
          onClick={onHost}
          className="w-full bg-indigo-600 text-white text-2xl font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]"
        >
          Create Your Own
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8 text-center pt-8">
        <div>
          <div className="text-3xl mb-1">⏱️</div>
          <div className="text-xs font-bold text-slate-400 uppercase">15s Timer</div>
        </div>
        <div>
          <div className="text-3xl mb-1">🤖</div>
          <div className="text-xs font-bold text-slate-400 uppercase">AI Powered</div>
        </div>
        <div>
          <div className="text-3xl mb-1">🏆</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Real-time Ranks</div>
        </div>
      </div>
    </div>
  );
};
