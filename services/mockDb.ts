import { User, Team, Habit, Log, ChallengeSettings, Role, AppState } from '../types';

const STORAGE_KEY = 'habitsync_db_v1';

const INITIAL_HABITS: Habit[] = [
  { id: 'h1', name: 'Drink 3L Water', description: 'Stay hydrated throughout the day', points: 5, category: 'health' },
  { id: 'h2', name: '30m Exercise', description: 'Any moderate to intense activity', points: 10, category: 'fitness' },
  { id: 'h3', name: 'Read 10 Pages', description: 'Read a book, not social media', points: 5, category: 'mindfulness' },
  { id: 'h4', name: 'No Sugar', description: 'Avoid added sugars and sweets', points: 8, category: 'health' },
  { id: 'h5', name: 'Sleep 8 Hours', description: 'Get a full night of rest', points: 10, category: 'health' },
];

const INITIAL_TEAMS: Team[] = [
  { id: 't1', name: 'Team Alpha', color: '#4f46e5', members: ['u1', 'u3'] },
  { id: 't2', name: 'Team Bravo', color: '#ea580c', members: ['u2', 'u4'] },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin Alice', email: 'admin@family.com', role: Role.ADMIN, teamId: 't1', avatarUrl: 'https://picsum.photos/100/100?random=1' },
  { id: 'u2', name: 'Bob Builder', email: 'bob@family.com', role: Role.MEMBER, teamId: 't2', avatarUrl: 'https://picsum.photos/100/100?random=2' },
  { id: 'u3', name: 'Charlie', email: 'charlie@family.com', role: Role.MEMBER, teamId: 't1', avatarUrl: 'https://picsum.photos/100/100?random=3' },
  { id: 'u4', name: 'Diana', email: 'diana@family.com', role: Role.MEMBER, teamId: 't2', avatarUrl: 'https://picsum.photos/100/100?random=4' },
];

const INITIAL_SETTINGS: ChallengeSettings = {
  name: 'Family Fitness Face-off 2024',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isActive: true,
};

// Seed logs for visual interest
const seedLogs = (): Log[] => {
  const logs: Log[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    INITIAL_USERS.forEach(user => {
      INITIAL_HABITS.forEach(habit => {
        if (Math.random() > 0.4) {
          logs.push({
            id: `${user.id}-${habit.id}-${dateStr}`,
            userId: user.id,
            habitId: habit.id,
            date: dateStr,
            completed: true
          });
        }
      });
    });
  }
  return logs;
};

const getInitialState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    currentUser: null,
    users: INITIAL_USERS,
    teams: INITIAL_TEAMS,
    habits: INITIAL_HABITS,
    logs: seedLogs(),
    settings: INITIAL_SETTINGS
  };
};

export const db = {
  state: getInitialState(),
  
  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  getState() {
    return this.state;
  },

  updateSettings(settings: ChallengeSettings) {
    this.state.settings = settings;
    this.save();
    return this.state;
  },

  addHabit(habit: Habit) {
    this.state.habits.push(habit);
    this.save();
    return this.state;
  },
  
  removeHabit(id: string) {
    this.state.habits = this.state.habits.filter(h => h.id !== id);
    this.save();
    return this.state;
  },

  toggleLog(userId: string, habitId: string, date: string) {
    const existingIndex = this.state.logs.findIndex(l => l.userId === userId && l.habitId === habitId && l.date === date);
    if (existingIndex >= 0) {
      this.state.logs.splice(existingIndex, 1);
    } else {
      this.state.logs.push({
        id: `${userId}-${habitId}-${date}`,
        userId,
        habitId,
        date,
        completed: true
      });
    }
    this.save();
    return [...this.state.logs];
  },

  addUser(user: User) {
    this.state.users.push(user);
    this.save();
    return this.state;
  },

  updateUserTeam(userId: string, teamId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      user.teamId = teamId;
      this.save();
    }
    return this.state;
  }
};
