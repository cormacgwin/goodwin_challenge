import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Team, User, Log, Habit } from '../types';
import { Trophy, Users } from 'lucide-react';

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
    members: users.filter(u => u.teamId === team.id).length
  })).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Trophy className="mr-2 text-yellow-500" /> Team Standings
        </h2>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32}>
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
          <div key={team.name} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center">
                <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold mr-3 ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-gray-100 text-gray-700' :
                  'bg-orange-50 text-orange-800'
                }`}>
                  {idx + 1}
                </span>
                <div>
                   <h3 className="font-bold text-gray-900">{team.name}</h3>
                   <div className="flex items-center text-xs text-gray-500 mt-0.5">
                     <Users size={12} className="mr-1" /> {team.members} Members
                   </div>
                </div>
             </div>
             <div className="text-right">
               <span className="block text-2xl font-bold text-indigo-600">{team.score}</span>
               <span className="text-xs text-gray-400">POINTS</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
