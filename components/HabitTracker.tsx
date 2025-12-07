
import React, { useState } from 'react';
import { User, Habit, Log, Team, ChallengeSettings } from '../types';
import { Check, Calendar, Trophy, ChevronLeft, ChevronRight, Info, Clock, Flag } from 'lucide-react';

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

  const getDayKey = (d: Date) => d.toISOString().split('T')[0];

  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const dateKey = getDayKey(currentDate);
  const isToday = dateKey === getDayKey(new Date());

  // --- PROGRESS WIDGET LOGIC ---
  const getChallengeProgress = () => {
    const start = new Date(settings.startDate);
    const end = new Date(settings.endDate);
    const now = new Date();
    
    // Normalize times to midnight to avoid partial day weirdness in calculation
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    now.setHours(0,0,0,0);

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    // Calculate percentage, clamped between 0 and 100
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

  const calculateDailyPoints = () => {
    return habits.reduce((acc, habit) => {
      const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateKey && l.completed);
      return acc + (isCompleted ? habit.points : 0);
    }, 0);
  };

  const getStreak = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    let streak = 0;
    let checkDate = new Date(today);
    
    // Check if any activity today
    const todayKey = getDayKey(today);
    const hasActivityToday = logs.some(l => l.userId === user.id && l.date === todayKey);
    
    if (hasActivityToday) streak = 1;

    // Check yesterday backwards
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

  const completedCount = habits.filter(h => logs.some(l => l.userId === user.id && l.habitId === h.id && l.date === dateKey)).length;

  // Sorting Logic: 
  // 1. Incomplete habits first (sorted by points descending)
  // 2. Completed habits last
  const sortedHabits = [...habits].sort((a, b) => {
    const isCompletedA = logs.some(l => l.userId === user.id && l.habitId === a.id && l.date === dateKey && l.completed);
    const isCompletedB = logs.some(l => l.userId === user.id && l.habitId === b.id && l.date === dateKey && l.completed);

    if (isCompletedA === isCompletedB) {
      // Both completed or both incomplete -> Sort by points descending
      return b.points - a.points;
    }
    // If A is completed (true) and B is not (false), A should go after B (return 1)
    return isCompletedA ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      
      {/* Challenge Progress Widget */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
        {/* Decorative Background Elements */}
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

      {/* Header with Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user.name.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 flex items-center mt-1">
             Team: <span className="font-semibold ml-1 text-indigo-600">{userTeam?.name || 'No Team'}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0 bg-gray-50 p-2 rounded-xl">
          <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            <span className="text-xs text-gray-500">
              {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </span>
          </div>
          <button 
            onClick={() => handleDateChange(1)} 
            disabled={isToday}
            className={`p-2 rounded-lg transition-colors shadow-sm ${isToday ? 'opacity-30 cursor-not-allowed text-gray-400' : 'hover:bg-white text-gray-600'}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-100 text-sm font-medium">Daily Points</p>
            <p className="text-4xl font-bold mt-1">{calculateDailyPoints()}</p>
          </div>
          <Trophy className="absolute right-4 bottom-4 text-indigo-500 opacity-50 h-16 w-16" />
        </div>
        
        <div 
          onClick={() => onNavigate('profile')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50 transition-colors group"
        >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center mr-4 transition-colors ${completedCount === habits.length ? 'bg-green-100 text-green-600' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200'}`}>
              <Check size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Habits Done</p>
              <p className="text-xl font-bold text-gray-900">
                {completedCount} / {habits.length}
              </p>
            </div>
        </div>
        
         <div 
          onClick={() => onNavigate('profile')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50 transition-colors group"
         >
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-4 group-hover:bg-orange-200 transition-colors">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-xl font-bold text-gray-900">
                 {getStreak()} Days
              </p>
            </div>
        </div>
      </div>

      {/* Habit List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Your Habits</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedHabits.map(habit => {
            const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateKey && l.completed);
            
            return (
              <div key={habit.id} className={`p-4 transition-all ${isCompleted ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleHabit(habit.id, dateKey)}
                      className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-gray-300 text-transparent hover:border-indigo-400'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    <div className="min-w-0">
                      <h3 className={`font-medium text-gray-900 truncate ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                        {habit.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {habit.category}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center truncate">
                           <Info size={12} className="mr-1 flex-shrink-0" />
                           <span className="truncate">{habit.description}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Points Box - Improved for Mobile */}
                  <div className="ml-4 flex-shrink-0">
                    <span className={`flex items-center justify-center w-20 py-1 rounded-full text-xs font-bold ${
                      isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      +{habit.points} pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
