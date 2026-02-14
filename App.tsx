
import React, { useState, useEffect, useCallback } from 'react';
import { HostView } from './components/HostView';
import { ParticipantView } from './components/ParticipantView';
import { LandingPage } from './components/LandingPage';
import { GameState, GameStatus } from './types';
import { getGameState } from './roomManager';

const App: React.FC = () => {
  const [view, setView] = useState<'LANDING' | 'HOST' | 'PARTICIPANT'>('LANDING');
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

  // Poll for global state changes if we are in a room
  useEffect(() => {
    if (!activeRoomCode) return;

    const interval = setInterval(() => {
      // Logic for components to pull latest state is handled within them
      // but we could trigger global state sync here if needed.
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoomCode]);

  const handleStartHost = () => {
    setView('HOST');
  };

  const handleJoin = (code: string) => {
    const state = getGameState(code);
    if (state) {
      setActiveRoomCode(code);
      setView('PARTICIPANT');
    } else {
      alert("Room not found!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
        {view === 'LANDING' && (
          <LandingPage onHost={handleStartHost} onJoin={handleJoin} />
        )}
        
        {view === 'HOST' && (
          <HostView onExit={() => setView('LANDING')} />
        )}

        {view === 'PARTICIPANT' && activeRoomCode && (
          <ParticipantView 
            roomCode={activeRoomCode} 
            onExit={() => {
              setView('LANDING');
              setActiveRoomCode(null);
            }} 
          />
        )}
      </div>
      
      {/* Footer / Branding */}
      <div className="mt-8 text-slate-400 font-medium flex items-center gap-2">
        <span className="text-xl">🌊</span> streekhook
      </div>
    </div>
  );
};

export default App;
