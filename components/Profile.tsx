
import React, { useMemo } from 'react';
import { User, Log, Habit, ChallengeSettings } from '../types';
import { ArrowLeft, Trophy, Flame, TrendingUp, BarChart, Banknote, TrendingDown } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ProfileProps {
  user: User;
  targetUser: User;
  allLogs: Log[];
  allHabits: Habit[];
  settings: ChallengeSettings;
  onUpdateAvatar: (url: string) => void;
  onBack?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  targetUser,
  allLogs,
  allHabits,
  settings,
  onUpdateAvatar,
  onBack
}) => {
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

  const stats = useMemo(() => {
    const userLogs = allLogs.filter(l => l.userId === targetUser.id && l.completed);
    const todayKey = getDayKey(new Date());
    const pointsToday = userLogs.filter(l => l.date === todayKey).reduce((sum, log) => {
        const h = allHabits.find(h => h.id === log.habitId);
        return sum + (h?.points || 0);
    }, 0);

    const userHabits = allHabits.filter(h => targetUser.habitIds?.includes(h.id));
    const activeHabitSet = userHabits.length > 0 ? userHabits : allHabits;

    const isPerfectDay = (date: Date) => {
      const dKey = getDayKey(date);
      if (activeHabitSet.length === 0) return false;
      return activeHabitSet.every(h => 
        userLogs.some(l => l.habitId === h.id && l.date === dKey)
      );
    };

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0,0,0,0);
    
    if (isPerfectDay(checkDate)) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        if (isPerfectDay(checkDate)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        if (isPerfectDay(checkDate)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
    }

    const habitCounts = allHabits.map(habit => {
      const count = userLogs.filter(l => l.habitId === habit.id).length;
      return { ...habit, count };
    }).sort((a, b) => b.count - a.count);

    const start = parseLocalDate(settings.startDate);
    const end = parseLocalDate(settings.endDate);
    const chartData = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dKey = getDayKey(d);
        const dailyPoints = userLogs.filter(l => l.date === dKey).reduce((sum, log) => {
            const h = allHabits.find(h => h.id === log.habitId);
            return sum + (h?.points || 0);
          }, 0);
        if (d <= today) chartData.push({ date: dKey, shortDate: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }), points: dailyPoints });
    }

    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dailyPossiblePoints = activeHabitSet.reduce((acc, h) => acc + h.points, 0);
    const totalPointsPossible = dailyPossiblePoints * durationDays;
    const valuePerPoint = totalPointsPossible > 0 ? settings.stakeAmount / totalPointsPossible : 0;
    
    const userTotalPoints = userLogs.reduce((acc, log) => {
      const h = allHabits.find(h => h.id === log.habitId);
      return acc + (h?.points || 0);
    }, 0);
    
    const savedSoFar = userTotalPoints * valuePerPoint;
    const currentDebt = Math.max(0, settings.stakeAmount - savedSoFar);

    // Calculate "Lost So Far" for profile
    let lostSoFar = 0;
    let missedHabitsCount = 0;
    const calcDate = new Date(start);
    while (calcDate < today) {
      const dKey = getDayKey(calcDate);
      activeHabitSet.forEach(habit => {
        const isDone = userLogs.some(l => l.habitId === habit.id && l.date === dKey);
        if (!isDone) {
          missedHabitsCount++;
          lostSoFar += (habit.points * valuePerPoint);
        }
      });
      calcDate.setDate(calcDate.getDate() + 1);
    }

    return { pointsToday, streak, habitCounts, chartData, savedSoFar, lostSoFar, missedHabitsCount, currentDebt };
  }, [targetUser, allLogs, allHabits, settings]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {!isOwnProfile && onBack && (
            <button onClick={onBack} className="mr-4 p-2 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-indigo-600 transition-all">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{isOwnProfile ? 'Your Progress' : `${targetUser.name}`}</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Challenge Participant Overview</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="relative inline-block mb-4">
              {targetUser.avatarUrl ? (
                <img src={targetUser.avatarUrl} alt="" className="h-32 w-32 rounded-full bg-gray-50 border-4 border-white shadow-xl object-cover" />
              ) : (
                <div className="h-32 w-32 rounded-full bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center text-4xl text-indigo-300 font-black">
                  {targetUser.name.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-black text-gray-900 truncate">{targetUser.name}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-2xl font-black text-gray-900">{stats.pointsToday}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-2xl font-black text-gray-900">{stats.streak}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Streak</p>
              </div>
            </div>
          </div>

          <div className="bg-green-600 rounded-3xl shadow-sm p-6 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-white opacity-10 rounded-full blur-lg"></div>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-green-100 mb-3 flex items-center">
               <Banknote size={14} className="mr-2" /> Current Payout
             </h3>
             <p className="text-4xl font-black text-white tracking-tighter mb-4">${stats.currentDebt.toFixed(2)}</p>
             <div className="space-y-3">
                <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/5">
                   <p className="text-[9px] font-black uppercase text-green-100 mb-1">Earned Back</p>
                   <p className="text-xl font-black text-white">+${stats.savedSoFar.toFixed(2)}</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/5">
                   <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-black uppercase text-red-100">Lost So Far</p>
                      <TrendingDown size={10} className="text-red-300" />
                   </div>
                   <p className="text-xl font-black text-white">-${stats.lostSoFar.toFixed(2)}</p>
                   <p className="text-[8px] font-black uppercase text-red-100/70">{stats.missedHabitsCount} habits missed</p>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center mb-6"><BarChart size={16} className="mr-2 text-indigo-600" /> Challenge Activity</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}/>
                  <Bar dataKey="points" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={12} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center mb-6"><TrendingUp size={16} className="mr-2 text-indigo-600" /> Most Frequent Habits</h3>
            <div className="space-y-6">
              {stats.habitCounts.slice(0, 5).map((habit, index) => (
                <div key={habit.id}>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-gray-900">{habit.name}</p>
                    <p className="text-[10px] font-black text-indigo-600">{habit.count} completions</p>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(habit.count / Math.max(...stats.habitCounts.map(h => h.count), 1)) * 100}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
