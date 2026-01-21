
import React, { useState, useEffect, useMemo } from 'react';
import { User, Habit, Log, Team, ChallengeSettings } from '../types';
import { Check, Flag, ChevronLeft, ChevronRight, Trophy, Flame, Clock, X, HelpCircle, Banknote, DollarSign, BarChart as BarChartIcon, Settings, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import confetti from 'canvas-confetti';

interface HabitTrackerProps {
  user: User;
  habits: Habit[];
  logs: Log[];
  userTeam?: Team;
  settings: ChallengeSettings;
  onToggleHabit: (habitId: string, date: string) => void;
  onNavigate: (view: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ 
  user, 
  habits, 
  logs, 
  userTeam,
  settings,
  onToggleHabit,
  onNavigate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [optimisticChecked, setOptimisticChecked] = useState<string[]>([]);
  const [toast, setToast] = useState<{message: string, visible: boolean} | null>(null);
  const [activeDescriptionId, setActiveDescriptionId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDayKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const dateKey = getDayKey(currentDate);

  useEffect(() => {
    setOptimisticChecked(prev => prev.filter(id => 
      !logs.some(l => l.userId === user.id && l.habitId === id && l.date === dateKey && l.completed)
    ));
  }, [logs, user.id, dateKey]);

  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        setToast(prev => prev ? { ...prev, visible: false } : null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Only show habits the user has explicitly selected
  const userHabits = useMemo(() => {
    if (user.habitIds && user.habitIds.length > 0) {
      return habits.filter(h => user.habitIds?.includes(h.id));
    }
    return []; // Enforce selection: show nothing if not selected
  }, [habits, user.habitIds]);

  const finance = useMemo(() => {
    const start = parseLocalDate(settings.startDate);
    const end = parseLocalDate(settings.endDate);
    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Financial calculations based on the user's selected set
    const activeHabitSet = userHabits.length > 0 ? userHabits : habits;
    const dailyPossiblePoints = activeHabitSet.reduce((acc, h) => acc + h.points, 0);
    const totalPossiblePoints = dailyPossiblePoints * durationDays;
    const valuePerPoint = totalPossiblePoints > 0 ? settings.stakeAmount / totalPossiblePoints : 0;

    const userLogs = logs.filter(l => l.userId === user.id && l.completed);
    const userPoints = userLogs.reduce((acc, log) => {
      const h = habits.find(h => h.id === log.habitId);
      return acc + (h?.points || 0);
    }, 0);

    const savedSoFar = userPoints * valuePerPoint;
    const currentDebt = Math.max(0, settings.stakeAmount - savedSoFar);

    const todayPointsPossible = dailyPossiblePoints;
    const todayPointsEarned = userHabits.reduce((acc, h) => {
      const isDone = logs.some(l => l.userId === user.id && l.habitId === h.id && l.date === dateKey && l.completed);
      return acc + (isDone ? h.points : 0);
    }, 0);
    const costOfToday = (todayPointsPossible - todayPointsEarned) * valuePerPoint;

    // Calculate "Lost So Far" - Guaranteed loss from missed habits in the past
    let lostSoFar = 0;
    let missedHabitsCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let d = new Date(start); d < today; d.setDate(d.getDate() + 1)) {
      const dKey = getDayKey(d);
      activeHabitSet.forEach(habit => {
        const isDone = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dKey && l.completed);
        if (!isDone) {
          missedHabitsCount++;
          lostSoFar += (habit.points * valuePerPoint);
        }
      });
    }

    return { valuePerPoint, savedSoFar, lostSoFar, missedHabitsCount, currentDebt, costOfToday, dailyPossiblePoints };
  }, [settings, habits, userHabits, logs, user.id, dateKey]);

  const getChallengeStatus = () => {
    const startDate = parseLocalDate(settings.startDate);
    const endDate = parseLocalDate(settings.endDate);
    endDate.setHours(23, 59, 59, 999);
    const nowTime = now.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const isFuture = nowTime < startTime;
    const isFinished = nowTime > endTime;

    let countdownString = "";
    if (isFuture) {
      const diff = startTime - nowTime;
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      countdownString = `${d}d ${h}h ${m}m ${s}s`;
    }
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math.ceil((endTime - nowTime) / msPerDay);
    const totalDuration = endTime - startTime;
    const elapsed = nowTime - startTime;
    let percent = 0;
    if (!isFuture && totalDuration > 0) {
      percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }
    const currentDayNum = Math.floor((nowTime - startTime) / msPerDay) + 1;
    return { isFuture, countdownString, percent, daysLeft: Math.max(0, daysLeft), currentDayNum, isFinished };
  };

  const { isFuture, countdownString, percent, daysLeft, currentDayNum } = getChallengeStatus();

  const calculateDailyPoints = (dateStr: string) => {
    return userHabits.reduce((acc, habit) => {
      const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateStr && l.completed);
      return acc + (isCompleted ? habit.points : 0);
    }, 0);
  };

  const getStreak = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    let streak = 0;
    let checkDate = new Date(today);

    const isPerfectDay = (date: Date) => {
      const dKey = getDayKey(date);
      if (userHabits.length === 0) return false;
      return userHabits.every(h => 
        logs.some(l => l.userId === user.id && l.habitId === h.id && l.date === dKey && l.completed)
      );
    };

    // Check if today is already perfect
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
      // If today isn't perfect, check if yesterday was to preserve the streak
      checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        if (isPerfectDay(checkDate)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
    }
    return streak;
  };

  const getProgressData = () => {
    const start = parseLocalDate(settings.startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const data = [];
    const chartStart = new Date(today);
    chartStart.setDate(chartStart.getDate() - 7);
    const startLimit = chartStart < start ? start : chartStart;

    for (let d = new Date(startLimit); d <= today; d.setDate(d.getDate() + 1)) {
        const dKey = getDayKey(d);
        const points = calculateDailyPoints(dKey);
        data.push({
            date: dKey,
            shortDate: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
            points: points
        });
    }
    return data;
  };

  const chartData = useMemo(() => getProgressData(), [userHabits, logs, settings, user.id]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const getCalendarGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); 
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const days = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    const grid: (Date | null)[] = Array(offset).fill(null);
    return [...grid, ...days];
  };

  const handleToggle = (habitId: string) => {
    const isAlreadyCompleted = logs.some(l => l.userId === user.id && l.habitId === habitId && l.date === dateKey && l.completed);
    if (isAlreadyCompleted) {
      onToggleHabit(habitId, dateKey);
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#818cf8', '#fbbf24', '#f59e0b']
      });
      const currentCompleted = userHabits.filter(h => logs.some(l => l.userId === user.id && l.habitId === h.id && l.date === dateKey && l.completed)).length;
      const remaining = Math.max(0, userHabits.length - (currentCompleted + 1));
      const message = remaining === 0 
        ? "All habits completed! Amazing work! 🎉"
        : `Nice Work! Only ${remaining} left!`;
      setToast({ message, visible: true });
      setOptimisticChecked(prev => [...prev, habitId]);
      onToggleHabit(habitId, dateKey);
    }
  };

  return (
    <div className="space-y-6 relative" onClick={() => setActiveDescriptionId(null)}>
      {toast && (
        <div className={`fixed bottom-24 md:bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
           <div className="bg-indigo-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 backdrop-blur-md bg-opacity-95 border border-indigo-700">
             <Trophy size={18} className="text-yellow-400" />
             <span className="font-medium text-sm md:text-base text-white">{toast.message}</span>
           </div>
        </div>
      )}

      {/* 1. CHALLENGE PROGRESS */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between">
          <div>
             <h2 className="text-sm font-bold text-indigo-100 flex items-center mb-1 uppercase tracking-widest">
               {isFuture ? "Starts In" : "Challenge Progress"}
             </h2>
             {isFuture ? (
               <p className="text-4xl md:text-5xl font-black tabular-nums text-white tracking-tighter">
                 {countdownString}
               </p>
             ) : (
               <p className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                 Day {currentDayNum > 0 ? currentDayNum : 0}
               </p>
             )}
          </div>
          {!isFuture && (
            <div className="mt-4 md:mt-0 md:text-right">
               <p className="text-4xl md:text-5xl font-black text-white leading-none">
                 {daysLeft}
               </p>
               <p className="text-indigo-100 font-bold uppercase tracking-widest text-[10px] mt-1">Days Left</p>
            </div>
          )}
        </div>
        {!isFuture && (
          <div className="relative z-10 mt-6">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-100 mb-2">
              <span>{Math.round(percent)}% Complete</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm">
               <div 
                 className="bg-white h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                 style={{ width: `${percent}%` }}
               ></div>
            </div>
          </div>
        )}
      </div>

      {/* 2. FINANCIAL WIDGET */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-green-600 p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between">
              <div>
                 <h2 className="text-[10px] font-black uppercase tracking-widest text-green-100 flex items-center mb-2">
                    <Banknote size={14} className="mr-2" /> Financial Payout
                 </h2>
                 <p className="text-xs text-green-100 opacity-90 leading-relaxed mb-1">Current debt to winner:</p>
                 <p className="text-5xl font-black text-white tracking-tighter">
                    ${finance.currentDebt.toFixed(2)}
                 </p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                 <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10 text-right">
                    <p className="text-[10px] font-black uppercase text-green-100 mb-0.5">Saved So Far</p>
                    <p className="text-xl font-black text-white">+${finance.savedSoFar.toFixed(2)}</p>
                 </div>
                 <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10 text-right">
                    <div className="flex items-center justify-end mb-0.5">
                      <TrendingDown size={10} className="mr-1 text-red-300" />
                      <p className="text-[10px] font-black uppercase text-red-100">Lost So Far</p>
                    </div>
                    <p className="text-xl font-black text-white">-${finance.lostSoFar.toFixed(2)}</p>
                    <p className="text-[8px] font-black uppercase text-red-100/70">{finance.missedHabitsCount} habits missed</p>
                 </div>
              </div>
           </div>
        </div>
        <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
           <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                 <DollarSign size={18} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Today's Cost</p>
                 <p className="text-base font-black text-gray-900 leading-none mt-1">-${finance.costOfToday.toFixed(2)}</p>
              </div>
           </div>
           <button onClick={() => onNavigate('settings')} className="text-[10px] font-black text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-xl shadow-sm hover:bg-indigo-50 transition-all uppercase tracking-widest flex items-center">
              <Settings size={12} className="mr-1" /> Habits
           </button>
        </div>
      </div>

      {/* 3. HABITS LIST */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px] flex flex-col">
        {userHabits.length > 0 ? (
          <>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Daily {userHabits.length} Habits</h2>
                  <p className="text-xs text-gray-500 font-medium">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-widest">
                    {logs.filter(l => l.userId === user.id && user.habitIds?.includes(l.habitId) && l.date === dateKey && l.completed).length} / {userHabits.length} Done
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100 flex-1">
              {userHabits.sort((a,b) => b.points - a.points).map(habit => {
                const isActuallyCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateKey && l.completed);
                const isCompleted = isActuallyCompleted || optimisticChecked.includes(habit.id);
                const isDescriptionOpen = activeDescriptionId === habit.id;
                
                return (
                  <div key={habit.id} className={`p-4 transition-all duration-300 ${isCompleted ? 'bg-gray-50/50 opacity-75' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggle(habit.id); }}
                          className={`flex-shrink-0 h-10 w-10 rounded-2xl border-2 flex items-center justify-center transition-all transform active:scale-90 ${
                            isCompleted ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-gray-200 text-transparent hover:border-indigo-400 hover:text-indigo-200'
                          }`}
                        >
                          <Check size={20} strokeWidth={4} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-bold text-gray-900 truncate transition-all ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                              {habit.name}
                            </h3>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${isCompleted ? 'bg-gray-100 text-gray-300 border-gray-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                              +${(habit.points * finance.valuePerPoint).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-gray-400">{habit.category}</span>
                            {habit.description && (
                              <button onClick={(e) => { e.stopPropagation(); setActiveDescriptionId(prev => prev === habit.id ? null : habit.id); }} className="text-gray-300 hover:text-indigo-400"><HelpCircle size={12} /></button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`ml-4 px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-700'}`}>
                        +{habit.points}
                      </div>
                    </div>
                    {isDescriptionOpen && (
                      <div className="mt-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-xs text-indigo-800 font-medium leading-relaxed">{habit.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
             <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-400">
                <Settings size={40} strokeWidth={1.5} />
             </div>
             <div>
                <h3 className="text-lg font-black text-gray-900">Choose Your 5 Habits</h3>
                <p className="text-sm text-gray-500 max-w-xs mt-1">You haven't selected your habits for this challenge yet. Go to your settings to pick them!</p>
             </div>
             <button 
               onClick={() => onNavigate('settings')} 
               className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
             >
                Go to Settings
             </button>
          </div>
        )}
      </div>

      {/* 4. CALENDAR WIDGET - RESTORED */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-lg font-black tracking-tight text-gray-900">
               {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
             </h2>
             <div className="flex space-x-2">
                <button onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="p-2 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors text-gray-400 hover:text-indigo-600">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="p-2 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors text-gray-400 hover:text-indigo-600">
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>
          <div className="grid grid-cols-7 mb-4">
             {['M','T','W','T','F','S','S'].map((day, i) => (
               <div key={i} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">{day}</div>
             ))}
          </div>
          <div className="grid grid-cols-7 gap-y-4">
             {getCalendarGrid().map((date, idx) => {
               if (!date) return <div key={`empty-${idx}`}></div>;
               const dKey = getDayKey(date);
               const isSelected = dKey === dateKey;
               const dailyPoints = calculateDailyPoints(dKey);
               const percentComplete = (dailyPoints / Math.max(1, finance.dailyPossiblePoints)) * 100;
               const radius = 16;
               const circumference = 2 * Math.PI * radius;
               const offset = circumference - (percentComplete / 100) * circumference;
               
               return (
                 <div key={idx} className="flex flex-col items-center justify-center relative">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentDate(date); }} className="relative w-10 h-10 flex items-center justify-center group focus:outline-none">
                       <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r={radius} stroke="#f3f4f6" strokeWidth="3" fill="none" />
                          <circle cx="20" cy="20" r={radius} stroke={percentComplete > 0 ? "#4f46e5" : "transparent"} strokeWidth="3" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500 ease-out" />
                       </svg>
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all duration-200 ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-110' : 'text-gray-600 hover:bg-gray-100'}`}>
                          {date.getDate()}
                       </div>
                    </button>
                 </div>
               );
             })}
          </div>
      </div>

      {/* 5. RECENT ACTIVITY CHART */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center"><BarChartIcon size={16} className="mr-2 text-indigo-600" /> Recent Activity</h3>
           <p className="text-[10px] font-bold text-gray-400 uppercase">Points Tracker</p>
        </div>
        <div className="h-48 w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                 <Bar dataKey="points" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* 6. STATS CARDS */}
      <div className="grid grid-cols-2 gap-4 pb-4">
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
               <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                 <Trophy size={22} />
               </div>
               <div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Today</p>
                 <p className="text-2xl font-black text-gray-900 leading-none mt-1">{calculateDailyPoints(dateKey)}</p>
               </div>
           </div>
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
               <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                 <Flame size={22} />
               </div>
               <div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Streak</p>
                 <p className="text-2xl font-black text-gray-900 leading-none mt-1">{getStreak()}</p>
               </div>
           </div>
      </div>
    </div>
  );
};
