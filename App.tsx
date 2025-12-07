
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
  const [loading, setLoading] = useState(true);

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
      // 1. Check for existing session
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

    // 2. Listen for auth changes
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If we have state but no current user, show Auth
  if (!state?.currentUser) {
    return <Auth onLoginSuccess={() => {/* handled by auth listener */}} />;
  }

  return (
    <Layout 
      user={state.currentUser} 
      currentView={currentView} 
      onNavigate={setCurrentView} 
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
        />
      )}

      {currentView === 'profile' && (
        <Profile
          user={state.currentUser}
          logs={state.logs}
          habits={state.habits}
          settings={state.settings}
          onUpdateAvatar={async (url) => {
            if (!state.currentUser) return;
            const newState = await dataProvider.updateUserAvatar(state.currentUser.id, url);
            setState(newState);
          }}
          onUpdateRules={async (rules) => {
            const newState = await dataProvider.updateSettings({ ...state.settings, rules });
            setState(newState);
          }}
          onToggleHistory={async (habitId, date) => {
             if (!state.currentUser) return;
             const newState = await dataProvider.toggleLog(state.currentUser.id, habitId, date, state.logs);
             setState(newState);
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
        />
      )}
    </Layout>
  );
};

export default App;
