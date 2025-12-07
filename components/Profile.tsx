
import React, { useState, useRef } from 'react';
import { User, Log, Habit, ChallengeSettings, Role } from '../types';
import { Button } from './Button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Camera, Check, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ProfileProps {
  user: User;
  logs: Log[];
  habits: Habit[];
  settings: ChallengeSettings;
  onUpdateAvatar: (url: string) => void;
  onUpdateRules: (rules: string) => void;
  onToggleHistory: (habitId: string, date: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  logs, 
  habits, 
  settings, 
  onUpdateAvatar,
  onToggleHistory
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // --- AVATAR HANDLER ---
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
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          onUpdateAvatar(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // --- STATS HELPER ---
  const getDailyPoints = (date: string) => {
    return habits.reduce((acc, habit) => {
      const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === date && l.completed);
      return acc + (isCompleted ? habit.points : 0);
    }, 0);
  };

  // --- LINE CHART DATA (Full Challenge Duration, Daily Points) ---
  const getProgressData = () => {
      // Create chart data spanning from Challenge Start to Challenge End
      // If end date is very far in future, maybe cap at today + buffer? 
      // The prompt says "spans the entire duration of the challenge". 
      
      const start = new Date(settings.startDate);
      const end = new Date(settings.endDate);
      const data = [];

      // We will iterate through every day of the challenge
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0];
          const daily = getDailyPoints(dateKey);
          
          // Determine if this date is in the future relative to today
          const isFuture = d > new Date();

          data.push({
              date: dateKey,
              shortDate: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
              dailyPoints: isFuture && daily === 0 ? null : daily, // Don't plot 0s for future days to avoid confusing drop
          });
      }
      return data;
  };
  
  const progressData = getProgressData();
  
  // Calculate totals for summary cards based on *past* data (logs)
  const totalPoints = logs
    .filter(l => l.userId === user.id && l.completed)
    .reduce((acc, log) => {
        const habit = habits.find(h => h.id === log.habitId);
        return acc + (habit ? habit.points : 0);
    }, 0);

  // --- STREAK CALCULATION ---
  const getStreak = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    let streak = 0;
    let checkDate = new Date(today);
    
    const todayKey = today.toISOString().split('T')[0];
    if (getDailyPoints(todayKey) > 0) {
        streak = 1;
    }
    checkDate.setDate(checkDate.getDate() - 1);
    
    while(true) {
        const key = checkDate.toISOString().split('T')[0];
        if (getDailyPoints(key) > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  };

  // --- CALENDAR RENDERER ---
  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    
    const days = [];
    
    // Empty slots for prev month
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="h-10 md:h-14"></div>);
    }
    
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateKey = d.toISOString().split('T')[0];
        const points = getDailyPoints(dateKey);
        const isSelected = selectedDate === dateKey;
        const isToday = dateKey === new Date().toISOString().split('T')[0];
        
        // Validation: Is this date within the challenge range?
        const isWithinChallenge = dateKey >= settings.startDate && dateKey <= settings.endDate;

        // Color logic
        let bgClass = "";
        let textClass = "";
        let borderClass = "";
        let cursorClass = "cursor-pointer hover:shadow-md";

        if (!isWithinChallenge) {
             bgClass = "bg-gray-100 opacity-50";
             textClass = "text-gray-300";
             borderClass = "border border-transparent";
             cursorClass = "cursor-not-allowed";
        } else if (points > 0) {
            const maxPoints = habits.reduce((acc, h) => acc + h.points, 0);
            if (points >= maxPoints) {
                bgClass = "bg-green-100";
                textClass = "text-green-700 font-bold";
                borderClass = "border border-green-200";
            } else {
                bgClass = "bg-yellow-50";
                textClass = "text-yellow-700";
                borderClass = "border border-yellow-200";
            }
        } else {
            bgClass = "bg-gray-50";
            textClass = "text-gray-400";
            borderClass = "border border-transparent hover:border-gray-200";
        }

        if (isSelected) {
            bgClass = "bg-indigo-600";
            textClass = "text-white";
            borderClass = "shadow-lg scale-105 z-10";
        }
        
        if (isToday && !isSelected) {
            borderClass += " ring-2 ring-indigo-400 ring-offset-1";
        }

        days.push(
            <button
                key={dateKey}
                disabled={!isWithinChallenge}
                onClick={() => isWithinChallenge && setSelectedDate(dateKey)}
                className={`h-10 md:h-14 rounded-lg flex flex-col items-center justify-center text-xs md:text-sm transition-all relative ${bgClass} ${textClass} ${borderClass} ${cursorClass}`}
            >
                <span>{i}</span>
                {points > 0 && <span className="hidden md:block text-[9px] mt-1 opacity-90">{points} pts</span>}
                {points > 0 && <div className="md:hidden w-1 h-1 rounded-full bg-current mt-0.5"></div>}
            </button>
        );
    }
    
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:space-x-8 text-center md:text-left">
        <div className="relative group">
            {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-28 w-28 rounded-full bg-gray-100 mb-4 md:mb-0 border-4 border-white shadow-md object-cover" />
            ) : (
                <div className="h-28 w-28 rounded-full bg-gray-200 mb-4 md:mb-0 border-4 border-white shadow-md flex items-center justify-center">
                    <span className="text-4xl text-gray-400 font-bold">{user.name.charAt(0)}</span>
                </div>
            )}
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-0 bg-white p-2.5 rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-indigo-600 transition-colors md:mb-0 mb-4 hover:scale-105"
                title="Upload Photo"
            >
                <Camera size={18} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
        <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 font-medium">{user.email}</p>
            <div className="mt-3 flex items-center justify-center md:justify-start space-x-2">
                 <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wide border border-indigo-100">
                    {user.role}
                 </span>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Stats & Progress
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Calendar History
        </button>
      </div>

      <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-gray-100 min-h-[400px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                        <p className="text-orange-600 font-medium text-sm flex items-center mb-2"><Calendar className="mr-2" size={16} /> Current Streak</p>
                        <p className="text-3xl font-bold text-gray-900">{getStreak()} <span className="text-sm font-normal text-gray-500">days</span></p>
                        <p className="text-xs text-gray-500 mt-2">Consistent daily habits</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm">
                         <p className="text-blue-600 font-medium text-sm mb-2">Total Points</p>
                         <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
                         <p className="text-xs text-gray-500 mt-2">Lifetime points earned</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Performance</h3>
                    <div className="h-72 w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressData}>
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
                                <Line 
                                    type="monotone" 
                                    dataKey="dailyPoints" 
                                    stroke="#4f46e5" 
                                    strokeWidth={3} 
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                                    connectNulls={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">This chart shows your daily points for the entire duration of the challenge.</p>
                </div>
            </div>
        )}

        {/* CALENDAR HISTORY TAB */}
        {activeTab === 'history' && (
             <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
                    {/* Left: Calendar Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <div className="flex space-x-2">
                                <button onClick={() => {
                                    const d = new Date(calendarDate);
                                    d.setMonth(d.getMonth() - 1);
                                    setCalendarDate(d);
                                }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                                <button onClick={() => {
                                    const d = new Date(calendarDate);
                                    d.setMonth(d.getMonth() + 1);
                                    setCalendarDate(d);
                                }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center">
                            {['S','M','T','W','T','F','S'].map((d, i) => (
                                <div key={i} className="text-xs font-bold text-gray-400">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                            {renderCalendar()}
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">Dates outside the active challenge range cannot be edited.</p>
                    </div>

                    {/* Right: Edit Panel (Visible when date selected) */}
                    {selectedDate && (
                        <div className="w-full md:w-80 mt-8 md:mt-0 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner relative">
                            <button 
                                onClick={() => setSelectedDate(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                            <h4 className="font-bold text-gray-900 text-lg mb-1">
                                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </h4>
                            <p className="text-sm text-gray-500 mb-6">Edit your habits for this day.</p>
                            
                            <div className="space-y-3">
                                {habits.map(habit => {
                                    const isCompleted = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === selectedDate && l.completed);
                                    return (
                                        <button
                                            key={habit.id}
                                            onClick={() => onToggleHistory(habit.id, selectedDate)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                                                isCompleted 
                                                ? 'bg-white border-indigo-200 text-indigo-900 shadow-sm ring-1 ring-indigo-500' 
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="font-medium">{habit.name}</span>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isCompleted ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                {isCompleted && <Check size={12} className="text-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
             </div>
        )}
      </div>
    </div>
  );
};
