
import React from 'react';
import { User, Role } from '../types';
import { LayoutDashboard, BarChart3, Settings, LogOut, Medal, UserCircle } from 'lucide-react';

interface LayoutProps {
  user: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, currentView, onNavigate, onLogout, children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
         <span className="font-extrabold text-xl text-indigo-600 tracking-tight">The Challenge</span>
         <button 
           onClick={() => onNavigate('settings')} 
           className={`p-2 rounded-xl transition-all ${currentView === 'settings' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600'}`}
           aria-label="Settings"
         >
           <Settings size={22} />
         </button>
      </div>

      {/* Sidebar Navigation - Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-black text-indigo-600 tracking-tight">The Challenge</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Family Habit Tracker</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <LayoutDashboard size={18} className="mr-3" /> Dashboard
          </button>
          
          <button 
            onClick={() => onNavigate('leaderboard')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${currentView === 'leaderboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <BarChart3 size={18} className="mr-3" /> Leaderboard
          </button>

          <button 
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${currentView === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Settings size={18} className="mr-3" /> Habit Settings
          </button>

          {user.role === Role.ADMIN && (
            <button 
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${currentView === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Medal size={18} className="mr-3" /> Admin Panel
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
           <button 
              onClick={() => onNavigate('profile')}
              className={`flex items-center mb-4 w-full text-left p-3 rounded-xl transition-all ${currentView === 'profile' ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'}`}
           >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full bg-gray-200 border-2 border-white shadow-sm object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-indigo-50 border-2 border-white shadow-sm flex items-center justify-center text-indigo-300 text-xs font-black">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="ml-3 min-w-0">
                 <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">View Stats</p>
              </div>
           </button>
           <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
           >
             <LogOut size={14} className="mr-2" /> Sign Out
           </button>
        </div>
      </div>

      {/* Bottom Nav - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center p-2 z-30 pb-safe shadow-[0_-4px_20px_0px_rgba(0,0,0,0.03)]">
          <button 
            onClick={() => onNavigate('dashboard')} 
            className={`flex flex-col items-center p-2 rounded-2xl transition-all ${currentView === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold mt-1 uppercase">Stats</span>
          </button>
          <button 
            onClick={() => onNavigate('leaderboard')} 
            className={`flex flex-col items-center p-2 rounded-2xl transition-all ${currentView === 'leaderboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
          >
            <BarChart3 size={24} />
            <span className="text-[10px] font-bold mt-1 uppercase">Board</span>
          </button>
          <button 
            onClick={() => onNavigate('profile')} 
            className={`flex flex-col items-center p-2 rounded-2xl transition-all ${currentView === 'profile' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
          >
             <div className="h-6 w-6 rounded-full overflow-hidden border-2 border-current flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                   <span className="text-[10px] font-black">{user.name.charAt(0)}</span>
                )}
             </div>
            <span className="text-[10px] font-bold mt-1 uppercase">Me</span>
          </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
