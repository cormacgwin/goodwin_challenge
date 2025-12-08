
import { supabase } from './supabaseClient';
import { AppState, User, Habit, Team, Log, ChallengeSettings, Role } from '../types';

export const dataProvider = {
  // --- FETCH ALL DATA ---
  async getInitialState(): Promise<AppState> {
    const [
      { data: habits },
      { data: teams },
      { data: logsData },
      { data: settings },
      { data: profilesData }
    ] = await Promise.all([
      supabase.from('habits').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('logs').select('*'),
      supabase.from('settings').select('*').single(),
      supabase.from('profiles').select('*')
    ]);

    // Map DB snake_case to App camelCase
    const logs: Log[] = (logsData || []).map((l: any) => ({
      id: l.id,
      userId: l.user_id,
      habitId: l.habit_id,
      date: l.date,
      completed: l.completed
    }));

    const users: User[] = (profilesData || []).map((p: any) => ({
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role as Role,
      teamId: p.team_id,
      avatarUrl: p.avatar_url
    }));

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    let currentUser: User | null = null;
    
    if (session && users.length > 0) {
      currentUser = users.find(u => u.id === session.user.id) || null;
    }

    return {
      currentUser,
      users,
      teams: teams || [],
      habits: habits || [],
      logs,
      settings: settings ? {
        name: settings.name,
        startDate: settings.start_date,
        endDate: settings.end_date,
        isActive: settings.is_active,
        rules: settings.rules || '1. Log your habits daily.\n2. Be honest!'
      } : {
        name: 'New Challenge',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        isActive: true,
        rules: '1. Log your habits daily.\n2. Be honest!'
      }
    };
  },

  // --- ACTIONS ---

  async addHabit(habit: Habit) {
    const { error } = await supabase.from('habits').insert(habit);
    if (error) console.error('Error adding habit:', error);
    return this.getInitialState();
  },

  async removeHabit(id: string) {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) console.error('Error removing habit:', error);
    return this.getInitialState();
  },

  async updateSettings(settings: ChallengeSettings) {
    // We assume ID 1 for settings based on our SQL script
    const { error } = await supabase.from('settings').update({
       name: settings.name,
       start_date: settings.startDate,
       end_date: settings.endDate,
       is_active: settings.isActive,
       rules: settings.rules
    }).eq('id', 1);
    
    if (error) console.error('Error updating settings:', error);
    return this.getInitialState();
  },

  async updateUserTeam(userId: string, teamId: string) {
    const { error } = await supabase.from('profiles').update({ team_id: teamId }).eq('id', userId);
    if (error) console.error('Error updating user team:', error);
    return this.getInitialState();
  },

  async updateUserAvatar(userId: string, avatarUrl: string) {
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
    if (error) console.error('Error updating avatar:', error);
    return this.getInitialState();
  },

  async updateUserName(userId: string, name: string) {
    const { error } = await supabase.from('profiles').update({ name: name }).eq('id', userId);
    if (error) console.error('Error updating name:', error);
    return this.getInitialState();
  },

  async deleteAccount(userId: string) {
    // Note: This removes the profile entry. Supabase Auth user deletion requires Admin API, 
    // so for this client-side app, removing the profile effectively "deletes" them from the game.
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) console.error('Error deleting account:', error);
    await supabase.auth.signOut();
    return null; // Triggers a reload in App.tsx due to null state
  },

  async toggleLog(userId: string, habitId: string, date: string, currentLogs: Log[]) {
    // Check if log exists
    const existing = currentLogs.find(l => l.userId === userId && l.habitId === habitId && l.date === date);

    if (existing) {
      // Delete
      await supabase.from('logs').delete().eq('id', existing.id);
    } else {
      // Create
      await supabase.from('logs').insert({
        id: `${userId}-${habitId}-${date}`, 
        user_id: userId,
        habit_id: habitId,
        date: date,
        completed: true
      });
    }
    
    return this.getInitialState();
  }
};
