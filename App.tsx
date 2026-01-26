
import React, { useState, useEffect } from 'react';
import { dataProvider } from './services/dataProvider';
import { supabase } from './services/supabaseClient';
import { User, Role, AppState, Log } from './types';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { HabitTracker } from './components/HabitTracker';
import { Leaderboard } from './components/Leaderboard';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';
import { SettingsPage } from './components/SettingsPage';

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "The Challenge";
  }, []);

  const fetchData = async () => {
    try {
      const data = await dataProvider.getInitialState();
      setState(data);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session) await fetchData();
        else setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setLoading(true);
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setState(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleViewProfile = (userId: string) => {
    setTargetUserId(userId);
    setCurrentView('profile');
  };

  const handleMyProfile = () => {
    setTargetUserId(state?.currentUser?.id || null);
    setCurrentView('profile');
  };

  const handleToggleHabit = async (habitId: string, date: string) => {
    if (!state?.currentUser || !state) return;

    const userId = state.currentUser.id;
    const existingLog = state.logs.find(l => l.userId === userId && l.habitId === habitId && l.date === date);
    
    // --- OPTIMISTIC UI UPDATE ---
    // We update the local state immediately so the user sees the checkmark.
    // We do NOT wait for the database or re-fetch the entire state.
    const previousLogs = [...state.logs];
    let newLogs: Log[];

    if (existingLog) {
      newLogs = state.logs.filter(l => l.id !== existingLog.id);
    } else {
      const tempLog: Log = {
        id: `${userId}-${habitId}-${date}`,
        userId,
        habitId,
        date,
        completed: true
      };
      newLogs = [tempLog, ...state.logs];
    }

    setState({ ...state, logs: newLogs });

    // --- ASYNC BACKGROUND SYNC ---
    try {
      await dataProvider.toggleLog(userId, habitId, date, !!existingLog);
      // Success - no further action needed as state is already 'optimistically' updated
    } catch (error) {
      console.error("Sync failed, rolling back:", error);
      // ROLLBACK on failure
      setState({ ...state, logs: previousLogs });
      alert("Something went wrong saving your point. Please check your connection.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!state?.currentUser) {
    return <Auth onLoginSuccess={() => {}} />;
  }

  return (
    <Layout 
      user={state.currentUser} 
      currentView={currentView} 
      onNavigate={(view) => {
        if (view === 'profile') {
          handleMyProfile();
        } else {
          setCurrentView(view);
          setTargetUserId(null);
        }
      }} 
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && (
        <HabitTracker 
          user={state.currentUser}
          habits={state.habits}
          logs={state.logs}
          userTeam={state.teams.find(t => t.id === state.currentUser?.teamId)}
          settings={state.settings}
          onToggleHabit={handleToggleHabit}
          onNavigate={setCurrentView}
        />
      )}

      {currentView === 'leaderboard' && (
        <Leaderboard 
          teams={state.teams}
          users={state.users}
          logs={state.logs}
          habits={state.habits}
          settings={state.settings}
          onViewProfile={handleViewProfile}
        />
      )}

      {currentView === 'profile' && (
        <Profile
          user={state.currentUser}
          targetUser={state.users.find(u => u.id === targetUserId) || state.currentUser}
          allLogs={state.logs}
          allHabits={state.habits}
          settings={state.settings}
          onUpdateAvatar={async (url) => {
            if (!state.currentUser) return;
            await dataProvider.updateUserAvatar(state.currentUser.id, url);
            await fetchData();
          }}
          onBack={() => {
            setCurrentView('leaderboard');
            setTargetUserId(null);
          }}
        />
      )}

      {currentView === 'settings' && (
        <SettingsPage
          user={state.currentUser}
          allHabits={state.habits}
          onUpdateName={async (name) => {
            if (!state.currentUser) return;
            await dataProvider.updateUserName(state.currentUser.id, name);
            await fetchData();
          }}
          onUpdateAvatar={async (url) => {
            if (!state.currentUser) return;
            await dataProvider.updateUserAvatar(state.currentUser.id, url);
            await fetchData();
          }}
          onUpdateHabits={async (hids) => {
            if (!state.currentUser) return;
            await dataProvider.updateUserHabits(state.currentUser.id, hids);
            await fetchData();
            setCurrentView('dashboard');
          }}
          onDeleteAccount={async () => {
            if (!state.currentUser) return;
            await dataProvider.deleteAccount(state.currentUser.id);
          }}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'admin' && state.currentUser.role === Role.ADMIN && (
        <AdminPanel 
          settings={state.settings}
          habits={state.habits}
          teams={state.teams}
          users={state.users}
          onUpdateSettings={async (s) => {
            await dataProvider.updateSettings(s);
            await fetchData();
          }}
          onAddHabit={async (h) => {
            await dataProvider.addHabit(h);
            await fetchData();
          }}
          onRemoveHabit={async (id) => {
            await dataProvider.removeHabit(id);
            await fetchData();
          }}
          onUpdateUserTeam={async (uid, tid) => {
            await dataProvider.updateUserTeam(uid, tid);
            await fetchData();
          }}
          onAddTeam={async (team) => {
            await dataProvider.addTeam(team);
            await fetchData();
          }}
          onRemoveTeam={async (id) => {
            await dataProvider.removeTeam(id);
            await fetchData();
          }}
          onUpdateTeam={async (team) => {
            await dataProvider.updateTeam(team);
            await fetchData();
          }}
        />
      )}
    </Layout>
  );
};

export default App;
