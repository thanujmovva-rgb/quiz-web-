
import { GameState, GameStatus, Participant } from './types';

const STORAGE_KEY = 'STREEKHOOK_STATE_';

export const saveGameState = (roomCode: string, state: GameState) => {
  localStorage.setItem(STORAGE_KEY + roomCode, JSON.stringify(state));
};

export const getGameState = (roomCode: string): GameState | null => {
  const data = localStorage.getItem(STORAGE_KEY + roomCode);
  return data ? JSON.parse(data) : null;
};

export const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'
];
