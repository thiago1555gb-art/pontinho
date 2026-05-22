export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  scores: number[];
  totalScore: number;
  isEliminated: boolean;
  reentries: number;
}

export interface RegisteredPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  createdAt: number;
}

export interface Round {
  id: number;
  scores: { [playerId: string]: number };
  timestamp: number;
}

export interface Match {
  id: string;
  name: string;
  date: string;
  players: Player[];
  rounds: Round[];
  limitScore: number;
  isFinished: boolean;
  winnerId?: string;
  duration: number;
}

export interface GameSettings {
  limitScore: number;
  soundEnabled: boolean;
  theme: 'casino-green' | 'poker-red' | 'midnight-blue' | 'obsidian';
  allowReentry: boolean;
}

export interface PlayerStats {
  name: string;
  avatar: string;
  color: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  totalReentries: number;
  averageScore: number;
  lastPlayed: string;
}