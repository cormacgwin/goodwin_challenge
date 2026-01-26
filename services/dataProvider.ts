
import { supabase } from './supabaseClient';
import { AppState, User, Habit, Team, Log, ChallengeSettings, Role } from '../types';

const HABIT_SEP = ":::";

export const dataProvider = {
  // --- FETCH ALL DATA ---
  async getInitialState(): Promise<AppState> {
    const [
      { data: habits },
      { data: teamsData },
      // Increase limit to 20,000 and order by date descending
      // This ensures current data is never 'pushed out' by old data
      { data: logsData, error: logsError },
      { data: settingsData },
      { data: profilesData }
    ] = await Promise.all([
      supabase.from('habits').select('*'),
      supabase.from('teams').select('*').order('order_index', { ascending: true }),
      supabase.from('logs').select('*').order('date', { ascending: false }).limit(20000),
      supabase.from('settings').select('*').single(),
      supabase.from('profiles').select('*')
    ]);

    if (logsError) {
      console.error("Supabase Error fetching logs:", logsError.message);
    }

    // Map DB snake_case to App camelCase
    const logs: Log[] = (logsData || []).map((l: any) => ({
      id: l.id,
      userId: l.user_id,
      habitId: l.habit_id,
      date: l.date,
      completed: l.completed
    }));

    const users: User[] = (profilesData || []).map((p: any) => {
      let displayName = p.name || '';
      let habitIds: string[] = [];
      
      if (displayName.includes(HABIT_SEP)) {
        const parts = displayName.split(HABIT_SEP);
        displayName = parts[0].trim();
        try {
          habitIds = JSON.parse(parts[1]);
        } catch (e) {
          console.error("Failed to parse habit IDs for user", p.id);
        }
      }

      return {
        id: p.id,
        email: p.email,
        name: displayName,
        role: p.role as Role,
        teamId: p.team_id,
        avatarUrl: p.avatar_url,
        habitIds: habitIds
      };
    });

    const teams: Team[] = (teamsData || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      members: [], 
      order: t.order_index ?? 0
    }));

    const { data: { session } } = await supabase.auth.getSession();
    let currentUser: User | null = null;
    
    if (session && users.length > 0) {
      currentUser = users.find(u => u.id === session.user.id) || null;
    }

    let rules = settingsData?.rules || '1. Log your habits daily.\n2. Be honest!';
    let stakeAmount = 200;

    const stakeMatch = rules.match(/^\[STAKE:(\d+)\]/);
    if (stakeMatch) {
      stakeAmount = parseInt(stakeMatch[1], 10);
      rules = rules.replace(/^\[STAKE:\d+\]\s*/, '');
    }

    const settings: ChallengeSettings = settingsData ? {
      name: settingsData.name,
      startDate: settingsData.start_date,
      endDate: settingsData.end_date,
      isActive: settingsData.is_active,
      rules: rules,
      stakeAmount: stakeAmount
    } : {
      name: 'The Challenge',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      rules: rules,
      stakeAmount: 200
    };

    return {
      currentUser,
      users,
      teams,
      habits: habits || [],
      logs,
      settings
    };
  },

  async updateUserHabits(userId: string, habitIds: string[]) {
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single();
    let pureName = (profile?.name || '').split(HABIT_SEP)[0].trim();
    const encodedName = `${pureName}${HABIT_SEP}${JSON.stringify(habitIds)}`;

    const { error } = await supabase.from('profiles').update({ 
      name: encodedName
    }).eq('id', userId);
    
    if (error) console.error('Error saving user habits:', error.message);
    return this.getInitialState();
  },

  async addHabit(habit: Habit) {
    const { error } = await supabase.from('habits').insert(habit);
    if (error) console.error('Error adding habit:', error.message);
    return this.getInitialState();
  },

  async removeHabit(id: string) {
    await supabase.from('logs').delete().eq('habit_id', id);
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) console.error('Error removing habit:', error.message);
    return this.getInitialState();
  },

  async updateSettings(settings: ChallengeSettings) {
    const rulesWithStake = `[STAKE:${settings.stakeAmount}] ${settings.rules}`;
    const { error } = await supabase.from('settings').upsert({
       id: 1, 
       name: settings.name,
       start_date: settings.startDate,
       end_date: settings.endDate,
       is_active: settings.isActive,
       rules: rulesWithStake
    });
    if (error) console.error('Error updating settings:', error.message);
    return this.getInitialState();
  },

  async addTeam(team: Team) {
    const { error } = await supabase.from('teams').insert({
      id: team.id,
      name: team.name,
      color: team.color,
      order_index: team.order
    });
    if (error) console.error('Error adding team:', error.message);
    return this.getInitialState();
  },

  async removeTeam(teamId: string) {
    await supabase.from('profiles').update({ team_id: null }).eq('team_id', teamId);
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) console.error('Error removing team:', error.message);
    return this.getInitialState();
  },

  async updateTeam(team: Team) {
    const { error } = await supabase.from('teams').update({
      name: team.name,
      color: team.color,
      order_index: team.order
    }).eq('id', team.id);
    if (error) console.error('Error updating team:', error.message);
    return this.getInitialState();
  },

  async updateUserTeam(userId: string, teamId: string) {
    const { error } = await supabase.from('profiles').update({ team_id: teamId }).eq('id', userId);
    if (error) console.error('Error updating user team:', error.message);
    return this.getInitialState();
  },

  async updateUserAvatar(userId: string, avatarUrl: string) {
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
    if (error) console.error('Error updating avatar:', error.message);
    return this.getInitialState();
  },

  async updateUserName(userId: string, newPureName: string) {
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single();
    const habitData = (profile?.name || '').split(HABIT_SEP)[1];
    const encodedName = habitData ? `${newPureName.trim()}${HABIT_SEP}${habitData}` : newPureName.trim();

    const { error } = await supabase.from('profiles').update({ name: encodedName }).eq('id', userId);
    if (error) console.error('Error updating name:', error.message);
    return this.getInitialState();
  },

  async deleteAccount(userId: string) {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) console.error('Error deleting account:', error.message);
    await supabase.auth.signOut();
    return null;
  },

  async toggleLog(userId: string, habitId: string, date: string, isCompleted: boolean) {
    // Generate a predictable unique ID for the log to prevent duplicates
    const logId = `${userId}-${habitId}-${date}`;
    
    if (isCompleted) {
      // Deleting a log
      const { error } = await supabase.from('logs').delete().eq('id', logId);
      if (error) throw error;
      return { type: 'delete', id: logId };
    } else {
      // Adding a log
      const newLog = {
        id: logId, 
        user_id: userId,
        habit_id: habitId,
        date: date,
        completed: true
      };
      // Upsert ensures that if the record exists (e.g. from another session), it just updates it
      const { error } = await supabase.from('logs').upsert(newLog);
      if (error) throw error;
      return { 
        type: 'insert', 
        log: {
          id: logId,
          userId: userId,
          habitId: habitId,
          date: date,
          completed: true
        }
      };
    }
  }
};
