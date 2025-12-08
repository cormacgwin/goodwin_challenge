
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Team, User, Log, Habit } from '../types';
import { Trophy, CheckCircle2, Circle } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  users: User[];
  logs: Log[];
  habits: Habit[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ teams, users, logs, habits }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Helper to get today's key in YYYY-MM-DD local time
  const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = getTodayKey();

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

  const hasLoggedToday = (userId: string) => {
    return logs.some(l => l.userId === userId && l.date === todayKey && l.completed);
  };

  // Base data calculation
  const rawData = teams.map(team => ({
    name: team.name,
    score: getTeamScore(team.id),
    color: team.color,
    order: team.order,
    members: users.filter(u => u.teamId === team.id),
    memberCount: users.filter(u => u.teamId === team.id).length
  }));

  // Chart Data: Sorted by Admin Order
  const chartData = [...rawData].sort((a, b) => a.order - b.order);

  // Card Data: Sorted by Score (Desc)
  const cardData = [...rawData].sort((a, b) => b.score - a.score);

  // Custom Tick Component to handle wrapping text
  const CustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const text = payload.value;
    
    // Split logic: Priority to "&", otherwise space
    let lines = [];
    if (text.includes(' & ')) {
        lines = text.split(' & ').map((part: string, i: number, arr: string[]) => 
            i < arr.length - 1 ? `${part} &` : part
        );
    } else {
        // If name is very long (> 12 chars) and has spaces, split it
        lines = text.length > 12 && text.includes(' ') ? text.split(' ') : [text];
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#6b7280" fontSize={11} fontWeight={600}>
          {lines.map((line: string, index: number) => (
            <tspan x={0} dy={index === 0 ? 0 : 12} key={index}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Trophy className="mr-2 text-yellow-500" /> Team Standings
        </h2>
        
        {/* Vertical Bars: X Axis = Name, Y Axis = Score */}
        {/* Added wrapper with strict dimensions to fix Recharts width(-1) error */}
        <div style={{ width: '100%', height: 400, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: isMobile ? 0 : 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                interval={0} // Force show all labels
                tick={isMobile ? false : <CustomAxisTick />}
                height={isMobile ? 10 : 60}
              />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={50}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cardData.map((team, idx) => (
          <div key={team.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                 <div className="flex items-center">
                    <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold mr-3 ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-50 text-orange-800'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                       <h3 className="font-bold text-gray-900 text-lg">{team.name}</h3>
                       <p className="text-sm text-gray-500">{team.memberCount} Members</p>
                    </div>
                 </div>
                 <div className="text-right">
                   <span className="block text-2xl font-bold text-indigo-600">{team.score}</span>
                   <span className="text-xs text-gray-400">POINTS</span>
                 </div>
             </div>
             
             {/* Team Members List */}
             <div>
               <div className="flex items-center justify-between mb-2">
                 <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Team Members</h4>
                 <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Activity Today</span>
               </div>
               
               <div className="space-y-2">
                 {team.members.length > 0 ? team.members.map(member => {
                   const activeToday = hasLoggedToday(member.id);
                   return (
                     <div key={member.id} className="flex items-center justify-between text-sm text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                       <div className="flex items-center">
                         {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt="" className="h-8 w-8 rounded-full mr-3 bg-gray-200 object-cover" />
                         ) : (
                            <div className="h-8 w-8 rounded-full mr-3 bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                                {member.name.charAt(0)}
                            </div>
                         )}
                         <span className="font-medium">{member.name}</span>
                       </div>
                       
                       {/* Activity Indicator */}
                       <div title={activeToday ? "Logged points today" : "No points logged today"}>
                          {activeToday ? (
                            <CheckCircle2 size={20} className="text-green-500 fill-green-50" />
                          ) : (
                            <Circle size={20} className="text-gray-200 fill-gray-50" />
                          )}
                       </div>
                     </div>
                   );
                 }) : (
                   <p className="text-xs text-gray-400 italic">No members assigned yet.</p>
                 )}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
