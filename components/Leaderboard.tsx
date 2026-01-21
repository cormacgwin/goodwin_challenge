
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Team, User, Log, Habit, ChallengeSettings } from '../types';
import { Trophy, CheckCircle2, Circle, ChevronRight, Banknote, HelpCircle, X } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  users: User[];
  logs: Log[];
  habits: Habit[];
  settings: ChallengeSettings;
  onViewProfile?: (userId: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ teams, users, logs, habits, settings, onViewProfile }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPotInfo, setShowPotInfo] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const getDayKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = getDayKey(new Date());

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const durationDays = useMemo(() => {
    const start = parseLocalDate(settings.startDate);
    const end = parseLocalDate(settings.endDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }, [settings.startDate, settings.endDate]);

  const getTeamScore = (teamId: string) => {
    const teamMembers = users.filter(u => u.teamId === teamId);
    let score = 0;
    teamMembers.forEach(member => {
      const memberLogs = logs.filter(l => l.userId === member.id && l.completed);
      memberLogs.forEach(log => {
        const habit = habits.find(h => h.id === log.habitId);
        if (habit) score += habit.points;
      });
    });
    return score;
  };

  const getUserLostSoFar = (user: User) => {
    const start = parseLocalDate(settings.startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const userHabits = habits.filter(h => user.habitIds?.includes(h.id));
    const activeHabitSet = userHabits.length > 0 ? userHabits : habits;
    const dailyPossiblePoints = activeHabitSet.reduce((acc, h) => acc + h.points, 0);
    const totalPossiblePoints = dailyPossiblePoints * durationDays;
    const valuePerPoint = totalPossiblePoints > 0 ? settings.stakeAmount / totalPossiblePoints : 0;

    let lost = 0;
    for (let d = new Date(start); d < today; d.setDate(d.getDate() + 1)) {
        const dKey = getDayKey(d);
        activeHabitSet.forEach(habit => {
            const isDone = logs.some(l => l.userId === user.id && l.habitId === habit.id && l.date === dKey && l.completed);
            if (!isDone) {
                lost += (habit.points * valuePerPoint);
            }
        });
    }
    return lost;
  };

  const totalPot = useMemo(() => {
    return users.reduce((sum, user) => sum + getUserLostSoFar(user), 0);
  }, [users, habits, logs, settings, durationDays]);

  const getTeamDebt = (teamId: string) => {
    const teamMembers = users.filter(u => u.teamId === teamId);
    let totalTeamDebt = 0;

    teamMembers.forEach(member => {
      const memberHabits = habits.filter(h => member.habitIds?.includes(h.id));
      const activeHabitSet = memberHabits.length > 0 ? memberHabits : habits;
      
      const dailyPossiblePoints = activeHabitSet.reduce((acc, h) => acc + h.points, 0);
      const totalPossiblePoints = dailyPossiblePoints * durationDays;
      const userValuePerPoint = totalPossiblePoints > 0 ? settings.stakeAmount / totalPossiblePoints : 0;

      const memberLogs = logs.filter(l => l.userId === member.id && l.completed);
      const memberPoints = memberLogs.reduce((acc, log) => {
        const h = habits.find(h => h.id === log.habitId);
        return acc + (h?.points || 0);
      }, 0);

      const savedSoFar = memberPoints * userValuePerPoint;
      const debt = Math.max(0, settings.stakeAmount - savedSoFar);
      totalTeamDebt += debt;
    });
    
    return totalTeamDebt;
  };

  const hasLoggedToday = (userId: string) => {
    return logs.some(l => l.userId === userId && l.date === todayKey && l.completed);
  };

  const rawData = teams.map(team => ({
    name: team.name,
    score: getTeamScore(team.id),
    debt: getTeamDebt(team.id),
    color: team.color,
    order: team.order,
    members: users.filter(u => u.teamId === team.id),
    memberCount: users.filter(u => u.teamId === team.id).length
  }));

  const chartData = [...rawData].sort((a, b) => a.order - b.order);
  const cardData = [...rawData].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* THE CURRENT POT WIDGET - Refined height and matching gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-lg p-5 text-white relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex items-center justify-between">
           <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 mb-1 flex items-center">
                 <Trophy size={12} className="mr-1.5 text-yellow-400" /> The Current Pot
              </h2>
              <p className="text-4xl font-black tracking-tighter text-white">
                 ${totalPot.toFixed(2)}
              </p>
           </div>
           <button 
             onClick={() => setShowPotInfo(!showPotInfo)}
             className={`p-2 rounded-xl transition-all ${showPotInfo ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
             aria-label="Info"
           >
             {showPotInfo ? <X size={20} /> : <HelpCircle size={20} />}
           </button>
        </div>

        {showPotInfo && (
           <div className="relative z-10 mt-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
             <p className="text-xs text-indigo-50 font-medium leading-relaxed">
               This pot represents the total money <strong>already lost</strong> by participants from missed habits. This amount is guaranteed to be paid out to the winner at the end of the challenge.
             </p>
           </div>
        )}
      </div>

      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Trophy className="mr-2 text-yellow-500" /> Team Standings
        </h2>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ 
                top: 10, 
                right: isMobile ? 0 : 20, 
                left: isMobile ? -45 : 0, 
                bottom: isMobile ? -20 : 20 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                interval={0} 
                height={isMobile ? 0 : 50} 
                tick={isMobile ? false : {fill: '#9ca3af', fontSize: 12, fontWeight: 600}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 10}} 
              />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={isMobile ? 35 : 50}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cardData.map((team, idx) => (
          <div key={team.name} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                 <div className="flex items-center">
                    <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl font-black mr-3 ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-400'}`}>{idx + 1}</span>
                    <div>
                       <h3 className="font-bold text-gray-900 text-lg leading-none mb-1">{team.name}</h3>
                       <div className="flex items-center bg-red-50 px-2 py-0.5 rounded-full">
                          <Banknote size={10} className="text-red-500 mr-1" />
                          <span className="text-[10px] font-black text-red-600 uppercase">Owes: ${team.debt.toFixed(2)}</span>
                       </div>
                    </div>
                 </div>
                 <div className="text-right">
                   <span className="block text-2xl font-black text-indigo-600 leading-none">{team.score}</span>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PTS</span>
                 </div>
             </div>
             <div>
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Participants</h4>
                 <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded uppercase">Activity Today</span>
               </div>
               <div className="space-y-3">
                 {team.members.map(member => {
                   const activeToday = hasLoggedToday(member.id);
                   return (
                     <button key={member.id} onClick={() => onViewProfile?.(member.id)} className="w-full flex items-center justify-between text-sm p-3 hover:bg-indigo-50/50 rounded-2xl transition-all group text-left">
                       <div className="flex items-center">
                         {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-10 w-10 rounded-full mr-3 bg-gray-100 border-2 border-white shadow-sm object-cover" /> : <div className="h-10 w-10 rounded-full mr-3 bg-indigo-50 border-2 border-white shadow-sm flex items-center justify-center text-xs text-indigo-300 font-black">{member.name.charAt(0)}</div>}
                         <div>
                            <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{member.name}</span>
                            <span className="flex items-center text-[10px] text-gray-400 group-hover:text-indigo-400">View profile <ChevronRight size={10} className="ml-0.5" /></span>
                         </div>
                       </div>
                       <div>{activeToday ? <CheckCircle2 size={24} className="text-green-500 fill-green-50" /> : <Circle size={24} className="text-gray-100 fill-gray-50" />}</div>
                     </button>
                   );
                 })}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
