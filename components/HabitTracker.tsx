
import React, { useState } from 'react';
import { User, Habit, Log, Team, ChallengeSettings } from '../types';
import { Check, Flag, ChevronLeft, ChevronRight, Trophy, Flame, Star } from 'lucide-react';

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

  const getDayKey = (d: Date) => d.toISOString().split('T')[0];
  const dateKey = getDayKey(currentDate);

  // --- PROGRESS WIDGET LOGIC ---
  const getChallengeProgress = () => {
    const start = new Date(settings.startDate);
    const end = new Date(settings.endDate);
    const now = new Date();
    
    // Normalize
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    now.setHours(0,0,0,0);

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    let percent = 0;
    if (totalDuration > 0) {
      percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / msPerDay);
    const currentDayNum = Math.ceil((now.getTime() - start.getTime()) / msPerDay) + 1;

    return { percent, daysLeft, currentDayNum };
  };

  const { percent, daysLeft, currentDayNum } = getChallengeProgress();

  // --- STATS LOGIC ---
  const calculateDailyPoints = (dateStr: string) => {
    return habits.reduce((acc, habit) => {
      const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateStr && l.completed);
      return acc + (isCompleted ? habit.points : 0);
    }, 0);
  };

  const getStreak = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
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
    
    // Adjust so Monday is first day (0 index in our mapping)
    // JS getDay(): 0=Sun, 1=Mon... 
    // We want 0=Mon, 1=Tue... 6=Sun
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

  // --- SORTING ---
  const sortedHabits = [...habits].sort((a, b) => {
    const isCompletedA = logs.some(l => l.userId === user.id && l.habitId === a.id && l.date === dateKey && l.completed);
    const isCompletedB = logs.some(l => l.userId === user.id && l.habitId === b.id && l.date === dateKey && l.completed);

    if (isCompletedA === isCompletedB) return b.points - a.points;
    return isCompletedA ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. CHALLENGE PROGRESS */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between">
          <div className="mb-4 md:mb-0">
             <h2 className="text-lg font-medium text-indigo-100 flex items-center mb-1">
               <Flag size={18} className="mr-2" /> Challenge Progress
             </h2>
             <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
               Day {currentDayNum > 0 ? currentDayNum : 0}
             </p>
             <p className="text-indigo-200 text-sm mt-1 font-medium">Keep pushing forward!</p>
          </div>
          
          <div className="text-left md:text-right">
             <p className="text-6xl md:text-7xl font-black text-white leading-none">
               {daysLeft > 0 ? daysLeft : 0}
             </p>
             <p className="text-indigo-200 font-bold uppercase tracking-wider text-sm mt-1">Days Left</p>
          </div>
        </div>

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
               {sortedHabits.filter(h => logs.some(l => l.userId === user.id && l.habitId === h.id && l.date === dateKey && l.completed)).length} / {habits.length} Done
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedHabits.map(habit => {
            const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateKey && l.completed);
            
            return (
              <div key={habit.id} className={`p-4 transition-all ${isCompleted ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleHabit(habit.id, dateKey)}
                      className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' 
                          : 'border-gray-300 text-transparent hover:border-indigo-400 hover:scale-105'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    <div className="min-w-0">
                      <h3 className={`font-medium text-gray-900 truncate ${isCompleted ? 'line-through text-gray-400' : ''}`}>
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
                  {/* Points Box */}
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
          {sortedHabits.length === 0 && (
             <div className="p-8 text-center text-gray-400 text-sm">
                No habits assigned yet.
             </div>
          )}
        </div>
      </div>

      {/* 3. LIGHT CALENDAR WIDGET */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative">
          {/* Header */}
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

          {/* Days Header */}
          <div className="grid grid-cols-7 mb-4">
             {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => (
               <div key={day} className="text-center text-xs font-bold text-gray-400 tracking-wider">
                 {day}
               </div>
             ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-4 md:gap-y-6">
             {getCalendarGrid().map((date, idx) => {
               if (!date) return <div key={`empty-${idx}`}></div>;

               const isSelected = getDayKey(date) === dateKey;
               const percentComplete = getDailyCompletionPercent(date);
               
               // SVG Ring Config
               const radius = 18;
               const circumference = 2 * Math.PI * radius;
               const offset = circumference - (percentComplete / 100) * circumference;
               
               return (
                 <div key={idx} className="flex flex-col items-center justify-center">
                    <button 
                      onClick={() => setCurrentDate(date)}
                      className="relative w-12 h-12 flex items-center justify-center group focus:outline-none"
                    >
                       {/* SVG Progress Ring */}
                       <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
                          {/* Track */}
                          <circle 
                            cx="24" cy="24" r={radius} 
                            stroke="#f3f4f6" strokeWidth="4" fill="none" 
                          />
                          {/* Progress */}
                          <circle 
                            cx="24" cy="24" r={radius} 
                            stroke={percentComplete > 0 ? "#4f46e5" : "transparent"} strokeWidth="4" fill="none" 
                            strokeDasharray={circumference} 
                            strokeDashoffset={offset} 
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-out"
                          />
                       </svg>

                       {/* Date Text & Selection Background */}
                       <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10 transition-all duration-200
                          ${isSelected 
                            ? 'bg-indigo-600 text-white shadow-md scale-105' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                       `}>
                          {date.getDate()}
                       </div>
                    </button>
                 </div>
               );
             })}
          </div>
      </div>

      {/* 4. STATS SUMMARY (Compact) */}
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
    </div>
  );
};
