
import React, { useState, useEffect } from 'react';
import { dataProvider } from './services/dataProvider';
import { supabase } from './services/supabaseClient';
import { User, Role, AppState } from './types';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { HabitTracker } from './components/HabitTracker';
import { Leaderboard } from './components/Leaderboard';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Force the browser tab title to update
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
        if (session) {
           await fetchData();
        } else {
           setLoading(false);
        }
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
        <div className="space-y-6">
          <HabitTracker 
            user={state.currentUser}
            habits={state.habits}
            logs={state.logs}
            userTeam={state.teams.find(t => t.id === state.currentUser?.teamId)}
            settings={state.settings}
            onToggleHabit={async (habitId, date) => {
              if (!state.currentUser) return;
              const newState = await dataProvider.toggleLog(state.currentUser.id, habitId, date, state.logs);
              setState(newState);
            }}
            onNavigate={setCurrentView}
          />
        </div>
      )}

      {currentView === 'leaderboard' && (
        <Leaderboard 
          teams={state.teams}
          users={state.users}
          logs={state.logs}
          habits={state.habits}
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
            const newState = await dataProvider.updateUserAvatar(state.currentUser.id, url);
            setState(newState);
          }}
          onUpdateName={async (name) => {
            if (!state.currentUser) return;
            const newState = await dataProvider.updateUserName(state.currentUser.id, name);
            setState(newState);
          }}
          onDeleteAccount={async () => {
            if (!state.currentUser) return;
            await dataProvider.deleteAccount(state.currentUser.id);
          }}
          onLogout={handleLogout}
          onBack={() => {
            setCurrentView('leaderboard');
            setTargetUserId(null);
          }}
        />
      )}

      {currentView === 'admin' && state.currentUser.role === Role.ADMIN && (
        <AdminPanel 
          settings={state.settings}
          habits={state.habits}
          teams={state.teams}
          users={state.users}
          onUpdateSettings={async (s) => {
            const newState = await dataProvider.updateSettings(s);
            setState(newState);
          }}
          onAddHabit={async (h) => {
            const newState = await dataProvider.addHabit(h);
            setState(newState);
          }}
          onRemoveHabit={async (id) => {
            const newState = await dataProvider.removeHabit(id);
            setState(newState);
          }}
          onUpdateUserTeam={async (uid, tid) => {
            const newState = await dataProvider.updateUserTeam(uid, tid);
            setState(newState);
          }}
          onAddTeam={async (team) => {
            const newState = await dataProvider.addTeam(team);
            setState(newState);
          }}
          onRemoveTeam={async (id) => {
            const newState = await dataProvider.removeTeam(id);
            setState(newState);
          }}
          onUpdateTeam={async (team) => {
            const newState = await dataProvider.updateTeam(team);
            setState(newState);
          }}
        />
      )}
    </Layout>
  );
};

export default App;
