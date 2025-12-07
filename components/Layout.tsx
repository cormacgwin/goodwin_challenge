
import React from 'react';
import { User, Role } from '../types';
import { LayoutDashboard, BarChart3, Settings, LogOut, Medal } from 'lucide-react';

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
         <span className="font-bold text-xl text-indigo-600">The Challenge</span>
         <button onClick={onLogout} className="text-gray-500"><LogOut size={20} /></button>
      </div>

      {/* Sidebar Navigation */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold text-indigo-600 tracking-tight">The Challenge</h1>
          <p className="text-xs text-gray-500 mt-1">Family Habit Tracker</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={18} className="mr-3" /> Dashboard
          </button>
          
          <button 
            onClick={() => onNavigate('leaderboard')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${currentView === 'leaderboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <BarChart3 size={18} className="mr-3" /> Leaderboard
          </button>

          {user.role === Role.ADMIN && (
            <button 
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${currentView === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Settings size={18} className="mr-3" /> Admin Panel
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
           <button 
              onClick={() => onNavigate('profile')}
              className="flex items-center mb-4 w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
           >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full bg-gray-200 object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="ml-3">
                 <p className="text-sm font-medium text-gray-900 truncate w-32">{user.name}</p>
                 <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
              </div>
           </button>
           <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
           >
             <LogOut size={14} className="mr-2" /> Sign Out
           </button>
        </div>
      </div>

      {/* Bottom Nav for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-30 pb-safe">
          <button onClick={() => onNavigate('dashboard')} className={`p-2 rounded-lg ${currentView === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
            <LayoutDashboard size={24} />
          </button>
          <button onClick={() => onNavigate('leaderboard')} className={`p-2 rounded-lg ${currentView === 'leaderboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
            <BarChart3 size={24} />
          </button>
           {user.role === Role.ADMIN ? (
            <button onClick={() => onNavigate('admin')} className={`p-2 rounded-lg ${currentView === 'admin' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
              <Settings size={24} />
            </button>
          ) : (
            <button onClick={() => onNavigate('profile')} className={`p-2 rounded-lg ${currentView === 'profile' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
               <div className="h-6 w-6 rounded-full overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                     <span className="text-xs font-bold text-gray-500">{user.name.charAt(0)}</span>
                  )}
               </div>
            </button>
          )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
