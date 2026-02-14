
import React, { useState, useEffect, useId } from 'react';
import { GameState, GameStatus, UserProfile } from '../types';
import { getGameState, saveGameState, AVATARS } from '../roomManager';

interface Props {
  roomCode: string;
  onExit: () => void;
}

export const ParticipantView: React.FC<Props> = ({ roomCode, onExit }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const participantId = useId();

  // Load profile from session storage if exists
  useEffect(() => {
    const saved = sessionStorage.getItem('STREEKHOOK_USER');
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  // Sync Game State
  useEffect(() => {
    const interval = setInterval(() => {
      const state = getGameState(roomCode);
      if (state) {
        setGameState(state);
      } else {
        onExit(); // Room gone?
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [roomCode]);

  // Reset answer state when question changes
  useEffect(() => {
    if (gameState?.status === GameStatus.QUESTION) {
      setHasAnswered(false);
      setSelectedIdx(null);
    }
  }, [gameState?.currentQuestionIndex, gameState?.status]);

  const handleJoinLobby = (user: UserProfile) => {
    const current = getGameState(roomCode);
    if (!current) return;

    const newParticipant = {
      id: participantId,
      ...user,
      score: 0,
      lastAnswerCorrect: null,
      hasAnswered: false
    };

    const updated = {
      ...current,
      participants: [...current.participants.filter(p => p.id !== participantId), newParticipant]
    };
    
    setProfile(user);
    sessionStorage.setItem('STREEKHOOK_USER', JSON.stringify(user));
    saveGameState(roomCode, updated);
  };

  const handleAnswer = (idx: number) => {
    if (hasAnswered || !gameState) return;

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = idx === currentQuestion.correctIndex;
    const points = isCorrect ? Math.max(100, Math.round(gameState.timerSeconds * 66)) : 0;

    setHasAnswered(true);
    setSelectedIdx(idx);

    // Update global state
    const updated = {
      ...gameState,
      participants: gameState.participants.map(p => 
        p.id === participantId 
          ? { ...p, score: p.score + points, hasAnswered: true, lastAnswerCorrect: isCorrect }
          : p
      )
    };
    saveGameState(roomCode, updated);
  };

  if (!profile) {
    return <LoginView onJoin={handleJoinLobby} />;
  }

  if (!gameState) return <div className="p-8 text-center">Loading Room...</div>;

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Participant Header */}
      <div className="bg-white p-4 flex justify-between items-center border-b shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{profile.avatar}</span>
          <span className="font-bold text-slate-700">{profile.name}</span>
        </div>
        <div className="text-indigo-600 font-black text-xl">
          {gameState.participants.find(p => p.id === participantId)?.score || 0}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {gameState.status === GameStatus.LOBBY && (
          <div className="space-y-6 animate-pulse">
            <div className="text-6xl">🙌</div>
            <h1 className="text-4xl font-bold">You're in!</h1>
            <p className="text-xl text-slate-500">Wait for the host to start the wave...</p>
          </div>
        )}

        {gameState.status === GameStatus.QUESTION && (
          <div className="w-full max-w-lg space-y-6">
            <h2 className="text-2xl font-bold mb-8">Choose fast!</h2>
            {!hasAnswered ? (
              <div className="grid grid-cols-2 gap-4">
                {gameState.questions[gameState.currentQuestionIndex].options.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`h-32 text-4xl rounded-2xl shadow-md active:scale-[0.95] transition-all flex items-center justify-center
                      ${['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'][i]}
                    `}
                  >
                    {['🔺', '🔷', '🟡', '🟩'][i]}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-in zoom-in">
                <div className="text-6xl">⏳</div>
                <h3 className="text-3xl font-bold">Answer Received!</h3>
                <p className="text-slate-400">Waiting for others to finish...</p>
              </div>
            )}
          </div>
        )}

        {gameState.status === GameStatus.SHOW_ANSWER && (
          <div className="space-y-8 animate-in bounce-in">
             {gameState.participants.find(p => p.id === participantId)?.lastAnswerCorrect ? (
               <div className="space-y-4">
                 <div className="text-8xl">🔥</div>
                 <h2 className="text-5xl font-black text-green-500">CORRECT!</h2>
                 <p className="text-2xl font-bold">+ {Math.round(gameState.timerSeconds * 66)} points</p>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="text-8xl">😢</div>
                 <h2 className="text-5xl font-black text-red-500">Ouch!</h2>
                 <p className="text-xl text-slate-400">Not quite right this time.</p>
               </div>
             )}
          </div>
        )}

        {gameState.status === GameStatus.LEADERBOARD && (
          <div className="space-y-6">
            <div className="text-4xl font-bold">Standings</div>
            <p className="text-xl text-indigo-600 font-bold">Check the big screen!</p>
            <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-200">
               <span className="text-sm uppercase font-bold text-slate-400 block mb-2">Your Current Score</span>
               <span className="text-5xl font-black text-slate-800">
                 {gameState.participants.find(p => p.id === participantId)?.score || 0}
               </span>
            </div>
          </div>
        )}

        {gameState.status === GameStatus.FINISHED && (
          <div className="space-y-8">
            <div className="text-6xl">🏆</div>
            <h1 className="text-4xl font-bold">Game Over!</h1>
            <button
              onClick={onExit}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl text-xl font-bold"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginView: React.FC<{ onJoin: (u: UserProfile) => void }> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in zoom-in">
      <h1 className="text-4xl font-bold text-slate-800">Who are you?</h1>
      
      <div className="w-full max-w-sm space-y-6">
        <input
          type="text"
          placeholder="Enter Nickname"
          maxLength={15}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-center text-2xl font-bold p-4 rounded-xl border-2 focus:border-indigo-500 outline-none"
        />

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-4 text-center">Pick a funny avatar</p>
          <div className="grid grid-cols-5 gap-4 overflow-y-auto max-h-48 p-2">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => setSelectedAvatar(a)}
                className={`text-3xl p-2 rounded-xl transition-all ${selectedAvatar === a ? 'bg-indigo-500 scale-110' : 'hover:bg-slate-200'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onJoin({ name, avatar: selectedAvatar })}
          disabled={!name}
          className="w-full bg-indigo-600 text-white text-2xl font-bold py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg"
        >
          Let's Go!
        </button>
      </div>
    </div>
  );
};
