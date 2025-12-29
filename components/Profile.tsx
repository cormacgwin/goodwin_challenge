
import React, { useState, useRef, useMemo } from 'react';
import { User, Log, Habit, ChallengeSettings } from '../types';
import { Button } from './Button';
import { Camera, LogOut, Trash2, Save, User as UserIcon, ArrowLeft, Trophy, Flame, TrendingUp, BarChart } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ProfileProps {
  user: User; // The logged-in user
  targetUser: User; // The user whose profile we are viewing
  allLogs: Log[];
  allHabits: Habit[];
  settings: ChallengeSettings;
  onUpdateAvatar: (url: string) => void;
  onUpdateName: (name: string) => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
  onBack?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  targetUser,
  allLogs,
  allHabits,
  settings,
  onUpdateAvatar,
  onUpdateName,
  onDeleteAccount,
  onLogout,
  onBack
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(targetUser.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isOwnProfile = user.id === targetUser.id;

  const getDayKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // --- ANALYTICS CALCULATIONS ---
  const stats = useMemo(() => {
    const userLogs = allLogs.filter(l => l.userId === targetUser.id && l.completed);
    
    // 1. Points Today
    const todayKey = getDayKey(new Date());
    const pointsToday = userLogs
      .filter(l => l.date === todayKey)
      .reduce((sum, log) => {
        const h = allHabits.find(h => h.id === log.habitId);
        return sum + (h?.points || 0);
      }, 0);

    // 2. Streak
    let streak = 0;
    let checkDate = new Date();
    const todayPoints = userLogs.filter(l => l.date === getDayKey(checkDate)).length;
    if (todayPoints > 0) streak = 1;

    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const key = getDayKey(checkDate);
      const hasLogs = userLogs.some(l => l.date === key);
      if (hasLogs) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 3. Habit Strength
    const habitCounts = allHabits.map(habit => {
      const count = userLogs.filter(l => l.habitId === habit.id).length;
      return {
        ...habit,
        count
      };
    }).sort((a, b) => b.count - a.count);

    // 4. Progress Data
    const start = parseLocalDate(settings.startDate);
    const end = parseLocalDate(settings.endDate);
    const chartData = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dKey = getDayKey(d);
        const dailyPoints = userLogs
          .filter(l => l.date === dKey)
          .reduce((sum, log) => {
            const h = allHabits.find(h => h.id === log.habitId);
            return sum + (h?.points || 0);
          }, 0);

        if (d <= today) {
          chartData.push({
            date: dKey,
            shortDate: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
            points: dailyPoints
          });
        }
    }

    return { pointsToday, streak, habitCounts, chartData };
  }, [targetUser.id, allLogs, allHabits, settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          onUpdateAvatar(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    onUpdateName(name);
    setIsEditing(false);
  };

  const maxCompletions = Math.max(...stats.habitCounts.map(h => h.count), 1);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* HEADER / BACK BUTTON */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {!isOwnProfile && onBack && (
            <button 
              onClick={onBack}
              className="mr-4 p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {isOwnProfile ? 'Account Settings' : `${targetUser.name}'s Profile`}
            </h1>
            <p className="text-sm text-gray-500">{isOwnProfile ? 'Manage your details' : 'Challenge participant'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SIDEBAR: PHOTO & INFO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden text-center p-8">
            <div className="relative inline-block mb-4">
              {targetUser.avatarUrl ? (
                <img src={targetUser.avatarUrl} alt={targetUser.name} className="h-32 w-32 rounded-full bg-gray-50 border-4 border-white shadow-xl object-cover" />
              ) : (
                <div className="h-32 w-32 rounded-full bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-4xl text-indigo-200 font-black">{targetUser.name.charAt(0)}</span>
                </div>
              )}
              {isOwnProfile && (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full shadow-lg border-2 border-white text-white hover:bg-indigo-700 transition-transform active:scale-90"
                  >
                    <Camera size={16} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 truncate">{targetUser.name}</h2>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">{targetUser.role}</p>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <Trophy size={16} className="text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-black text-gray-900">{stats.pointsToday}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Today</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <Flame size={16} className="text-rose-500 mx-auto mb-1" />
                <p className="text-lg font-black text-gray-900">{stats.streak}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Streak</p>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center">
                <Save size={16} className="mr-2 text-indigo-600" /> My Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Display Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => { setName(e.target.value); setIsEditing(true); }}
                    className="block w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                {isEditing && (
                  <Button onClick={handleSaveName} className="w-full" size="sm">Update Profile</Button>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Account Email</label>
                  <p className="text-sm text-gray-500 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 truncate">{targetUser.email}</p>
                </div>
              </div>
              <div className="pt-4 space-y-3">
                <button onClick={onLogout} className="w-full flex items-center justify-center p-3 text-sm font-bold text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all">
                  <LogOut size={16} className="mr-2" /> Sign Out
                </button>
                <button onClick={() => setIsDeleting(true)} className="w-full flex items-center justify-center p-3 text-xs font-bold text-red-400 hover:text-red-600 transition-all">
                  <Trash2 size={14} className="mr-2" /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MAIN CONTENT: STATS & RANKING */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. CHALLENGE ACTIVITY CHART */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center mb-6">
              <BarChart size={16} className="mr-2 text-indigo-600" /> Challenge Activity
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="shortDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10}} 
                    minTickGap={20}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="points" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. HABIT STRENGTH RANKING */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center mb-6">
              <TrendingUp size={16} className="mr-2 text-indigo-600" /> Habit Performance
            </h3>
            <div className="space-y-6">
              {stats.habitCounts.map((habit, index) => (
                <div key={habit.id} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black mr-2 ${
                        index === 0 ? 'bg-amber-100 text-amber-600' :
                        index === 1 ? 'bg-slate-100 text-slate-500' :
                        index === 2 ? 'bg-orange-50 text-orange-400' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <p className="text-sm font-bold text-gray-900">{habit.name}</p>
                    </div>
                    <p className="text-xs font-black text-indigo-600">{habit.count} <span className="text-[10px] text-gray-400 font-bold uppercase ml-0.5">Times</span></p>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${
                        index === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                        index < 3 ? 'bg-indigo-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${(habit.count / maxCompletions) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {stats.habitCounts.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No habits logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL-ISH OVERLAY */}
      {isDeleting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Wait! Really?</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Deletng your account will remove all your points and history. This action cannot be reversed.</p>
            <div className="flex flex-col space-y-3">
              <Button onClick={onDeleteAccount} variant="danger">Yes, Delete Forever</Button>
              <button onClick={() => setIsDeleting(false)} className="text-sm font-bold text-gray-400 hover:text-gray-600 p-2">Actually, I'll stay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
