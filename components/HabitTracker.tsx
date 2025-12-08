
import React, { useState, useEffect } from 'react';
import { User, Habit, Log, Team, ChallengeSettings } from '../types';
import { Check, Flag, ChevronLeft, ChevronRight, Trophy, Flame, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

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
  const [viewDate, setViewDate] = useState(new Date()); // Controls the month currently being viewed
  const [now, setNow] = useState(new Date()); // Live clock for countdown
  const [optimisticChecked, setOptimisticChecked] = useState<string[]>([]);

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

  // --- CRITICAL DATE FIX ---
  // Helper to parse YYYY-MM-DD string into a Local Midnight Date object
  // ignoring timezones. e.g. "2025-01-01" -> Jan 1st 00:00:00 LOCAL
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // --- PROGRESS / COUNTDOWN LOGIC ---
  const getChallengeStatus = () => {
    // 1. Get dates relative to user's local time, not UTC
    const startDate = parseLocalDate(settings.startDate);
    const endDate = parseLocalDate(settings.endDate);
    
    // Set End Date to end of day (23:59:59) for countdown purposes
    endDate.setHours(23, 59, 59, 999);

    const nowTime = now.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const isFuture = nowTime < startTime;
    const isFinished = nowTime > endTime;

    // Countdown String
    let countdownString = "";
    if (isFuture) {
      const diff = startTime - nowTime;
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      countdownString = `${d}d ${h}h ${m}m ${s}s`;
    }

    // Days Left Calc
    // We calculate "Midnight End Date" minus "Now" to get remaining duration
    const msPerDay = 1000 * 60 * 60 * 24;
    // We use Math.max(0) to prevent negatives
    const daysLeft = Math.ceil((endTime - nowTime) / msPerDay);
    
    // Percent Complete
    const totalDuration = endTime - startTime;
    const elapsed = nowTime - startTime;
    let percent = 0;
    if (!isFuture && totalDuration > 0) {
      percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }
    
    // Current Day Number
    const currentDayNum = Math.floor((nowTime - startTime) / msPerDay) + 1;

    return { isFuture, countdownString, percent, daysLeft: Math.max(0, daysLeft), currentDayNum, isFinished };
  };

  const { isFuture, countdownString, percent, daysLeft, currentDayNum } = getChallengeStatus();

  // --- STATS HELPER FUNCTIONS ---
  const calculateDailyPoints = (dateStr: string) => {
    return habits.reduce((acc, habit) => {
      const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateStr && l.completed);
      return acc + (isCompleted ? habit.points : 0);
    }, 0);
  };

  const getStreak = () => {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);
    
    const todayKey = getDayKey(today);
    if (calculateDailyPoints(todayKey) > 0) streak = 1;

    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
        const key = getDayKey(checkDate);
        const hasActivity = logs.some(l => l.userId === user.id && l.date === key);
        if (hasActivity) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  };

  // --- CHART DATA GENERATION ---
  const getProgressData = () => {
    const start = parseLocalDate(settings.startDate);
    const end = parseLocalDate(settings.endDate);
    const data = [];
    
    let totalPoints = 0;
    let daysCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    // Iterate through every day of the challenge
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dKey = getDayKey(d);
        const daily = calculateDailyPoints(dKey);
        const isFutureDay = d > today;

        if (!isFutureDay) {
            totalPoints += daily;
            daysCount++;
        }

        data.push({
            date: dKey,
            shortDate: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
            dailyPoints: isFutureDay && daily === 0 ? null : daily, 
        });
    }
    
    const averagePoints = daysCount > 0 ? Math.round(totalPoints / daysCount) : 0;
    return { data, averagePoints };
  };

  const { data: chartData, averagePoints } = getProgressData();

  // --- CALENDAR WIDGET LOGIC ---
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

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
    const days = getDaysInMonth(year, month);
    const grid: (Date | null)[] = Array(offset).fill(null);
    return [...grid, ...days];
  };

  const getDailyCompletionPercent = (d: Date) => {
    const k = getDayKey(d);
    if (habits.length === 0) return 0;
    const completed = logs.filter(l => l.userId === user.id && l.date === k && l.completed).length;
    return (completed / habits.length) * 100;
  };

  // --- INTERACTION LOGIC ---
  const handleToggleWithDelay = (habitId: string) => {
    const isAlreadyCompleted = logs.some(l => l.userId === user.id && l.habitId === habitId && l.date === dateKey && l.completed);
    if (isAlreadyCompleted) {
      onToggleHabit(habitId, dateKey);
    } else {
      setOptimisticChecked(prev => [...prev, habitId]);
      setTimeout(() => {
        onToggleHabit(habitId, dateKey);
        setOptimisticChecked(prev => prev.filter(id => id !== habitId));
      }, 600);
    }
  };

  const sortedHabits = [...habits].sort((a, b) => {
    const isCompletedA = logs.some(l => l.userId === user.id && l.habitId === a.id && l.date === dateKey && l.completed);
    const isCompletedB = logs.some(l => l.userId === user.id && l.habitId === b.id && l.date === dateKey && l.completed);
    if (isCompletedA === isCompletedB) return b.points - a.points;
    return isCompletedA ? 1 : -1;
  });

  // Custom Label for Reference Line
  const CustomReferenceLabel = (props: any) => {
    const { viewBox, value } = props;
    const x = viewBox.width - 10;
    const y = viewBox.y;
  
    return (
      <g>
        <rect x={x - 55} y={y - 11} width="55" height="22" rx="4" fill="white" fillOpacity="0.9" />
        <text x={x - 28} y={y + 5} fill="#f97316" textAnchor="middle" fontSize="11" fontWeight="bold">
          {value}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CHALLENGE PROGRESS / COUNTDOWN */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between">
          <div className="mb-4 md:mb-0">
             <h2 className="text-lg font-medium text-indigo-100 flex items-center mb-1">
               {isFuture ? <Clock size={18} className="mr-2" /> : <Flag size={18} className="mr-2" />}
               {isFuture ? "Challenge Starts In" : "Challenge Progress"}
             </h2>
             
             {isFuture ? (
               <p className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums">
                 {countdownString}
               </p>
             ) : (
               <>
                 <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
                   Day {currentDayNum > 0 ? currentDayNum : 0}
                 </p>
                 <p className="text-indigo-200 text-sm mt-1 font-medium">Keep pushing forward!</p>
               </>
             )}
          </div>
          
          {!isFuture && (
            <div className="text-left md:text-right">
               <p className="text-6xl md:text-7xl font-black text-white leading-none">
                 {daysLeft}
               </p>
               <p className="text-indigo-200 font-bold uppercase tracking-wider text-sm mt-1">Days Left</p>
            </div>
          )}
        </div>

        {!isFuture && (
          <div className="relative z-10 mt-6">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
              <span>Start</span>
              <span>{Math.round(percent)}% Complete</span>
              <span>Finish</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-4 backdrop-blur-sm">
               <div 
                 className="bg-white h-4 rounded-full transition-all duration-1000 ease-out shadow-lg"
                 style={{ width: `${percent}%` }}
               ></div>
            </div>
          </div>
        )}
      </div>

      {/* 2. YOUR HABITS LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
               <h2 className="text-lg font-bold text-gray-900">Your Habits</h2>
               <p className="text-xs text-gray-500">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
               {habits.filter(h => logs.some(l => l.userId === user.id && l.habitId === h.id && l.date === dateKey && l.completed)).length} / {habits.length} Done
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedHabits.map(habit => {
            const isActuallyCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateKey && l.completed);
            const isOptimisticallyCompleted = optimisticChecked.includes(habit.id);
            const isCompleted = isActuallyCompleted || isOptimisticallyCompleted;
            
            return (
              <div key={habit.id} className={`p-4 transition-all duration-500 ${isCompleted ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleWithDelay(habit.id)}
                      className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' 
                          : 'border-gray-300 text-transparent hover:border-indigo-400 hover:scale-105'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    <div className="min-w-0">
                      <h3 className={`font-medium text-gray-900 truncate transition-all duration-300 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                        {habit.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {habit.category}
                        </span>
                        {habit.description && (
                          <span className="text-xs text-gray-400 flex items-center truncate">
                             <span className="truncate max-w-[150px]">{habit.description}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`flex items-center justify-center w-20 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      +{habit.points}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CALENDAR WIDGET */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold tracking-wide text-gray-900">
               {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
             </h2>
             <div className="flex space-x-2">
                <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors text-gray-500 hover:text-indigo-600">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => changeMonth(1)} className="p-2 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors text-gray-500 hover:text-indigo-600">
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>
          <div className="grid grid-cols-7 mb-4">
             {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => (
               <div key={day} className="text-center text-xs font-bold text-gray-400 tracking-wider">
                 {day}
               </div>
             ))}
          </div>
          <div className="grid grid-cols-7 gap-y-4 md:gap-y-6">
             {getCalendarGrid().map((date, idx) => {
               if (!date) return <div key={`empty-${idx}`}></div>;
               const isSelected = getDayKey(date) === dateKey;
               const percentComplete = getDailyCompletionPercent(date);
               const isToday = getDayKey(date) === getDayKey(new Date());
               const radius = 18;
               const circumference = 2 * Math.PI * radius;
               const offset = circumference - (percentComplete / 100) * circumference;
               return (
                 <div key={idx} className="flex flex-col items-center justify-center relative">
                    <button 
                      onClick={() => setCurrentDate(date)}
                      className="relative w-12 h-12 flex items-center justify-center group focus:outline-none"
                    >
                       <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r={radius} stroke="#f3f4f6" strokeWidth="4" fill="none" />
                          <circle 
                            cx="24" cy="24" r={radius} 
                            stroke={percentComplete > 0 ? "#4f46e5" : "transparent"} strokeWidth="4" fill="none" 
                            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                            className="transition-all duration-500 ease-out"
                          />
                       </svg>
                       <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10 transition-all duration-200
                          ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-gray-700 hover:bg-gray-50'}
                       `}>
                          {date.getDate()}
                       </div>
                    </button>
                    {isToday && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-500 rounded-full"></div>}
                 </div>
               );
             })}
          </div>
      </div>

      {/* 4. STATS SUMMARY & GRAPHS */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
               <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                 <Trophy size={20} />
               </div>
               <div>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Points Today</p>
                 <p className="text-xl font-black text-gray-900">{calculateDailyPoints(dateKey)}</p>
               </div>
           </div>
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
               <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                 <Flame size={20} />
               </div>
               <div>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Streak</p>
                 <p className="text-xl font-black text-gray-900">{getStreak()} Days</p>
               </div>
           </div>
        </div>

        {/* Daily Performance Graph */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Performance</h3>
             <div className="h-72 w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis 
                              dataKey="shortDate" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fill: '#9ca3af', fontSize: 12}} 
                              minTickGap={30}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                          <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value) => [`${value} pts`, 'Daily Points']}
                          />
                          <ReferenceLine 
                              y={averagePoints} 
                              stroke="#f97316" 
                              strokeDasharray="3 3" 
                              label={<CustomReferenceLabel value={`Avg: ${averagePoints}`} />}
                          />
                          <Bar dataKey="dailyPoints" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={12} />
                      </BarChart>
                  </ResponsiveContainer>
             </div>
             <p className="text-xs text-gray-400 text-center mt-2">Orange line indicates your average daily performance.</p>
        </div>
      </div>
    </div>
  );
};
