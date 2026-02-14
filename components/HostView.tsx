import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameStatus, Question, Participant } from '../types';
import { generateQuiz } from '../geminiService';
import { generateRoomCode, saveGameState, getGameState } from '../roomManager';

interface Props {
  onExit: () => void;
}

export const HostView: React.FC<Props> = ({ onExit }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  // Changed NodeJS.Timeout to number to fix 'Cannot find namespace NodeJS' in browser environment
  const timerRef = useRef<number | null>(null);

  // Sync with local storage for participants to "see"
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState.roomCode, gameState);
      
      // If we are hosting, we need to listen for new participants
      const interval = setInterval(() => {
        const latest = getGameState(gameState.roomCode);
        if (latest) {
          // Merge participants but keep host's control status
          setGameState(prev => {
            if (!prev) return latest;
            return {
              ...prev,
              participants: latest.participants
            };
          });
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [gameState?.roomCode]);

  // Quiz Timer Logic
  useEffect(() => {
    if (gameState?.status === GameStatus.QUESTION && gameState.timerSeconds > 0) {
      const t = setInterval(() => {
        setGameState(prev => {
          if (!prev || prev.timerSeconds <= 0) return prev;
          const nextTimer = prev.timerSeconds - 1;
          
          if (nextTimer === 0) {
            return { ...prev, timerSeconds: 0, status: GameStatus.SHOW_ANSWER };
          }
          return { ...prev, timerSeconds: nextTimer };
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [gameState?.status, gameState?.timerSeconds]);

  const handleCreateQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const questions = await generateQuiz(topic);
      const newState: GameState = {
        roomCode: generateRoomCode(),
        status: GameStatus.LOBBY,
        questions,
        currentQuestionIndex: 0,
        participants: [],
        startTime: Date.now(),
        timerSeconds: 15
      };
      setGameState(newState);
      saveGameState(newState.roomCode, newState);
    } catch (err) {
      alert("Failed to create quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    if (!gameState) return;
    setGameState({
      ...gameState,
      status: GameStatus.QUESTION,
      timerSeconds: 15
    });
  };

  const nextQuestion = () => {
    if (!gameState) return;
    const isLast = gameState.currentQuestionIndex >= gameState.questions.length - 1;
    setGameState({
      ...gameState,
      currentQuestionIndex: isLast ? gameState.currentQuestionIndex : gameState.currentQuestionIndex + 1,
      status: isLast ? GameStatus.FINISHED : GameStatus.QUESTION,
      timerSeconds: 15,
      participants: gameState.participants.map(p => ({ ...p, hasAnswered: false }))
    });
  };

  const showLeaderboard = () => {
    if (!gameState) return;
    setGameState({ ...gameState, status: GameStatus.LEADERBOARD });
  };

  if (!gameState) {
    return (
      <div className="flex-1 flex flex-col p-8 items-center justify-center space-y-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-3xl font-bold">What's the topic?</h2>
          <p className="text-slate-500">Tell us anything! Gemini will generate 5 questions instantly.</p>
          <input
            type="text"
            placeholder="e.g., Space Exploration, 90s Pop Music, Coding Basics"
            className="w-full text-xl p-4 rounded-xl border-2 focus:border-indigo-500 outline-none"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button
            onClick={handleCreateQuiz}
            disabled={loading || !topic}
            className="w-full py-4 bg-indigo-600 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '✨ Generating...' : 'Generate Quiz'}
          </button>
          <button onClick={onExit} className="text-slate-400 hover:text-slate-600 font-medium">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 text-white">
      {/* Host Header */}
      <div className="bg-slate-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500 px-4 py-2 rounded-lg text-2xl font-bold tracking-widest">
            {gameState.roomCode}
          </div>
          <span className="text-slate-400 font-medium">Topic: {topic}</span>
        </div>
        <button onClick={onExit} className="text-slate-400 hover:text-white">End Session</button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {gameState.status === GameStatus.LOBBY && (
          <div className="text-center space-y-12 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-5xl font-bold">Waiting for participants...</h1>
            <div className="flex flex-wrap justify-center gap-6">
              {gameState.participants.length === 0 ? (
                <div className="text-slate-500 italic text-xl">No one here yet. Join using the code above!</div>
              ) : (
                gameState.participants.map(p => (
                  <div key={p.id} className="bg-slate-700 px-6 py-4 rounded-2xl flex flex-col items-center gap-2 animate-bounce-short">
                    <span className="text-4xl">{p.avatar}</span>
                    <span className="font-bold">{p.name}</span>
                  </div>
                ))
              )}
            </div>
            {gameState.participants.length > 0 && (
              <button
                onClick={handleStartGame}
                className="bg-green-500 text-white text-3xl font-bold px-12 py-6 rounded-2xl hover:bg-green-600 shadow-2xl active:scale-[0.98]"
              >
                Start Game
              </button>
            )}
          </div>
        )}

        {gameState.status === GameStatus.QUESTION && (
          <div className="max-w-3xl mx-auto space-y-12 text-center">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase">Question {gameState.currentQuestionIndex + 1} of {gameState.questions.length}</span>
              <div className="w-20 h-20 rounded-full border-4 border-indigo-500 flex items-center justify-center text-3xl font-bold">
                {gameState.timerSeconds}
              </div>
            </div>
            <h2 className="text-5xl font-bold leading-tight">
              {gameState.questions[gameState.currentQuestionIndex].text}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {gameState.questions[gameState.currentQuestionIndex].options.map((opt, i) => (
                <div key={i} className={`p-6 text-2xl rounded-xl border-4 ${['border-red-500', 'border-blue-500', 'border-yellow-500', 'border-green-500'][i]} bg-slate-800 font-bold`}>
                  {opt}
                </div>
              ))}
            </div>
            <div className="text-slate-500">
              {gameState.participants.filter(p => p.hasAnswered).length} / {gameState.participants.length} answers received
            </div>
          </div>
        )}

        {gameState.status === GameStatus.SHOW_ANSWER && (
          <div className="max-w-3xl mx-auto text-center space-y-12">
            <h2 className="text-3xl text-slate-400">Correct Answer:</h2>
            <div className="p-8 text-5xl font-bold rounded-3xl bg-green-500 shadow-xl inline-block px-12">
              {gameState.questions[gameState.currentQuestionIndex].options[gameState.questions[gameState.currentQuestionIndex].correctIndex]}
            </div>
            <div className="pt-8">
              <button
                onClick={showLeaderboard}
                className="bg-indigo-600 px-12 py-6 text-2xl font-bold rounded-2xl hover:bg-indigo-700"
              >
                Show Standings
              </button>
            </div>
          </div>
        )}

        {gameState.status === GameStatus.LEADERBOARD && (
          <div className="max-w-2xl mx-auto space-y-8 text-center">
            <h1 className="text-4xl font-bold">Leaderboard</h1>
            <div className="space-y-4">
              {[...gameState.participants].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border-2 border-slate-700">
                  <span className="text-2xl font-bold w-12 text-slate-500">#{i + 1}</span>
                  <span className="text-3xl">{p.avatar}</span>
                  <span className="text-2xl font-bold flex-1 text-left">{p.name}</span>
                  <span className="text-2xl font-bold text-indigo-400">{p.score} pts</span>
                </div>
              ))}
            </div>
            <button
              onClick={nextQuestion}
              className="mt-12 bg-indigo-600 px-12 py-6 text-2xl font-bold rounded-2xl hover:bg-indigo-700"
            >
              {gameState.currentQuestionIndex >= gameState.questions.length - 1 ? 'Show Final Podium' : 'Next Question'}
            </button>
          </div>
        )}

        {gameState.status === GameStatus.FINISHED && (
          <FinalPodium participants={gameState.participants} onExit={onExit} />
        )}
      </div>
    </div>
  );
};

const FinalPodium: React.FC<{ participants: Participant[], onExit: () => void }> = ({ participants, onExit }) => {
  useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      // @ts-ignore
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      // @ts-ignore
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  const winners = [...participants].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12">
      <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">CONGRATULATIONS!</h1>
      <div className="flex items-end gap-8 pb-12">
        {/* Silver */}
        {winners[1] && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-6xl">{winners[1].avatar}</span>
            <div className="font-bold text-xl">{winners[1].name}</div>
            <div className="bg-slate-500 w-32 h-48 rounded-t-xl flex flex-col items-center justify-center shadow-lg">
              <span className="text-4xl font-bold">2nd</span>
              <span>{winners[1].score}</span>
            </div>
          </div>
        )}
        {/* Gold */}
        {winners[0] && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-8xl animate-bounce">{winners[0].avatar}</span>
            <div className="font-bold text-3xl">{winners[0].name}</div>
            <div className="bg-yellow-500 w-40 h-64 rounded-t-xl flex flex-col items-center justify-center shadow-2xl relative">
              <div className="absolute -top-10 text-6xl">👑</div>
              <span className="text-5xl font-black">1st</span>
              <span className="font-bold">{winners[0].score}</span>
            </div>
          </div>
        )}
        {/* Bronze */}
        {winners[2] && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-5xl">{winners[2].avatar}</span>
            <div className="font-bold text-lg">{winners[2].name}</div>
            <div className="bg-orange-800 w-32 h-32 rounded-t-xl flex flex-col items-center justify-center shadow-md">
              <span className="text-3xl font-bold">3rd</span>
              <span>{winners[2].score}</span>
            </div>
          </div>
        )}
      </div>
      <button onClick={onExit} className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-xl hover:bg-slate-200">Home</button>
    </div>
  );
};