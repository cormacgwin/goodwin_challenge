
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Team, User, Log, Habit, ChallengeSettings } from '../types';
import { Trophy, CheckCircle2, Circle, ChevronRight, Banknote } from 'lucide-react';

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = getTodayKey();

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Pre-calculate finance variables
  const financeVars = useMemo(() => {
    const start = parseLocalDate(settings.startDate);
    const end = parseLocalDate(settings.endDate);
    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dailyPossiblePoints = habits.reduce((acc, h) => acc + h.points, 0);
    const totalPossiblePoints = dailyPossiblePoints * durationDays;
    const valuePerPoint = totalPossiblePoints > 0 ? settings.stakeAmount / totalPossiblePoints : 0;
    return { valuePerPoint };
  }, [settings, habits]);

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

  const getTeamDebt = (teamId: string) => {
    const teamMembers = users.filter(u => u.teamId === teamId);
    let totalTeamDebt = 0;
    teamMembers.forEach(member => {
      const memberLogs = logs.filter(l => l.userId === member.id && l.completed);
      const memberPoints = memberLogs.reduce((acc, log) => {
        const h = habits.find(h => h.id === log.habitId);
        return acc + (h?.points || 0);
      }, 0);
      const debt = Math.max(0, settings.stakeAmount - memberPoints * financeVars.valuePerPoint);
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
                right: isMobile ? 5 : 20, 
                left: isMobile ? -25 : 0, 
                bottom: isMobile ? 0 : 20 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                interval={0} 
                height={isMobile ? 30 : 50} 
                tick={{fill: '#9ca3af', fontSize: isMobile ? 10 : 12, fontWeight: 600}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 10}} 
              />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={isMobile ? 30 : 50}>
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
