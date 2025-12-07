
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Team, User, Log, Habit } from '../types';
import { Trophy } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  users: User[];
  logs: Log[];
  habits: Habit[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ teams, users, logs, habits }) => {
  
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

  const data = teams.map(team => ({
    name: team.name,
    score: getTeamScore(team.id),
    color: team.color,
    members: users.filter(u => u.teamId === team.id),
    memberCount: users.filter(u => u.teamId === team.id).length
  })).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Trophy className="mr-2 text-yellow-500" /> Team Standings
        </h2>
        
        {/* Vertical Bars: X Axis = Name, Y Axis = Score */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={60}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((team, idx) => (
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
               <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team Members</h4>
               <div className="space-y-2">
                 {team.members.length > 0 ? team.members.map(member => (
                   <div key={member.id} className="flex items-center text-sm text-gray-700 p-2 hover:bg-gray-50 rounded-lg">
                     {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt="" className="h-6 w-6 rounded-full mr-2 bg-gray-200 object-cover" />
                     ) : (
                        <div className="h-6 w-6 rounded-full mr-2 bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                            {member.name.charAt(0)}
                        </div>
                     )}
                     {member.name}
                   </div>
                 )) : (
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
