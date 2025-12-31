
export enum Role {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId?: string;
  avatarUrl?: string;
  habitIds?: string[]; // IDs of the 5 habits selected for the challenge
}

export interface Team {
  id: string;
  name: string;
  color: string;
  members: string[]; // User IDs
  order: number;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  points: number;
  category: 'health' | 'productivity' | 'mindfulness' | 'fitness' | 'other';
}

export interface Log {
  id: string;
  userId: string;
  habitId: string;
  date: string; // ISO Date string YYYY-MM-DD
  completed: boolean;
}

export interface ChallengeSettings {
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  rules: string;
  stakeAmount: number;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  teams: Team[];
  habits: Habit[];
  logs: Log[];
  settings: ChallengeSettings;
}
