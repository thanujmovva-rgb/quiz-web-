
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  lastAnswerCorrect: boolean | null;
  hasAnswered: boolean;
}

export enum GameStatus {
  LOBBY = 'LOBBY',
  QUESTION = 'QUESTION',
  SHOW_ANSWER = 'SHOW_ANSWER',
  LEADERBOARD = 'LEADERBOARD',
  FINISHED = 'FINISHED'
}

export interface GameState {
  roomCode: string;
  status: GameStatus;
  questions: Question[];
  currentQuestionIndex: number;
  participants: Participant[];
  startTime: number;
  timerSeconds: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
}
