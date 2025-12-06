import React, { useState } from 'react';
import { User, Habit, Log, Team } from '../types';
import { Check, Calendar, Trophy, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface HabitTrackerProps {
  user: User;
  habits: Habit[];
  logs: Log[];
  userTeam?: Team;
  onToggleHabit: (habitId: string, date: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ 
  user, 
  habits, 
  logs, 
  userTeam,
  onToggleHabit 
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

  const calculateDailyPoints = () => {
    return habits.reduce((acc, habit) => {
      const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateKey && l.completed);
      return acc + (isCompleted ? habit.points : 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-4">
              <Check size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Habits Done</p>
              <p className="text-xl font-bold text-gray-900">
                {habits.filter(h => logs.some(l => l.userId === user.id && l.habitId === h.id && l.date === dateKey)).length} / {habits.length}
              </p>
            </div>
        </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-4">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Streak</p>
              <p className="text-xl font-bold text-gray-900">
                 🔥 Active
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
          {habits.map(habit => {
            const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dateKey && l.completed);
            
            return (
              <div key={habit.id} className={`p-4 transition-all ${isCompleted ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => onToggleHabit(habit.id, dateKey)}
                      className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-indigo-600 border-indigo-600 text-white scale-110' 
                          : 'border-gray-300 text-transparent hover:border-indigo-400'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    <div>
                      <h3 className={`font-medium text-gray-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                        {habit.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {habit.category}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                           <Info size={12} className="mr-1" />
                           {habit.description}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isCompleted ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
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
