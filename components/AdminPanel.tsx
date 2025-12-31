
import React, { useState } from 'react';
import { ChallengeSettings, Habit, User, Team } from '../types';
import { Button } from './Button';
import { Trash2, Plus, Share2, Copy, Check, Mail, ArrowUp, ArrowDown, Banknote } from 'lucide-react';

interface AdminPanelProps {
  settings: ChallengeSettings;
  habits: Habit[];
  teams: Team[];
  users: User[];
  onUpdateSettings: (s: ChallengeSettings) => void;
  onAddHabit: (h: Habit) => void;
  onRemoveHabit: (id: string) => void;
  onUpdateUserTeam: (userId: string, teamId: string) => void;
  onAddTeam: (team: Team) => void;
  onRemoveTeam: (teamId: string) => void;
  onUpdateTeam: (team: Team) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  habits,
  teams,
  users,
  onUpdateSettings,
  onAddHabit,
  onRemoveHabit,
  onUpdateUserTeam,
  onAddTeam,
  onRemoveTeam,
  onUpdateTeam
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'habits' | 'teams'>('settings');
  
  // Local state for new habit form
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitPoints, setNewHabitPoints] = useState(5);
  const [newHabitCat, setNewHabitCat] = useState<Habit['category']>('health');
  
  // Local state for new team form
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#4f46e5');

  // Invite state
  const [copied, setCopied] = useState(false);
  const inviteUrl = window.location.origin;

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if(newHabitName) {
      onAddHabit({
        id: `h_${Date.now()}`,
        name: newHabitName,
        description: 'Custom habit',
        points: newHabitPoints,
        category: newHabitCat
      });
      setNewHabitName('');
    }
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName) {
      const maxOrder = teams.length > 0 ? Math.max(...teams.map(t => t.order)) : 0;
      onAddTeam({
        id: `t_${Date.now()}`,
        name: newTeamName,
        color: newTeamColor,
        members: [],
        order: maxOrder + 1
      });
      setNewTeamName('');
    }
  };

  const handleMoveTeam = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === teams.length - 1) return;

    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    const teamA = teams[index];
    const teamB = teams[otherIndex];

    const orderA = teamA.order;
    const orderB = teamB.order;

    onUpdateTeam({ ...teamA, order: orderB });
    onUpdateTeam({ ...teamB, order: orderA });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join The Challenge',
          text: `Come join our family habit challenge! Sign up here: ${inviteUrl}`,
          url: inviteUrl,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      copyToClipboard();
    }
  };

  const emailInvite = () => {
    const subject = encodeURIComponent("Join The Challenge");
    const body = encodeURIComponent(`Come join our family habit challenge! Create an account here:\n\n${inviteUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          General Settings
        </button>
        <button 
          onClick={() => setActiveTab('habits')}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'habits' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Manage Habits
        </button>
        <button 
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'teams' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Teams & Users
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">Challenge Name</label>
              <input 
                type="text" 
                value={settings.name} 
                onChange={e => onUpdateSettings({...settings, name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input 
                    type="date" 
                    value={settings.startDate} 
                    onChange={e => onUpdateSettings({...settings, startDate: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input 
                    type="date" 
                    value={settings.endDate} 
                    onChange={e => onUpdateSettings({...settings, endDate: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  />
               </div>
            </div>

            {/* FINANCIAL SETTINGS */}
            <div className="pt-2">
              <label className="block text-sm font-bold text-gray-900 mb-1 flex items-center">
                <Banknote size={16} className="mr-2 text-green-600" /> Financial Stake
              </label>
              <p className="text-xs text-gray-500 mb-3">The total amount each user agrees to pay the winner if they complete 0% of the challenge.</p>
              <div className="relative mt-1 rounded-md shadow-sm max-w-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={settings.stakeAmount}
                  onChange={e => onUpdateSettings({...settings, stakeAmount: Number(e.target.value)})}
                  className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 bg-white text-gray-900"
                  placeholder="200"
                />
              </div>
            </div>
            
            {/* INVITE SECTION */}
             <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <div>
                   <h4 className="text-sm font-bold text-gray-900 flex items-center">
                     <Share2 size={16} className="mr-2 text-indigo-600"/> Invite Participants
                   </h4>
                   <p className="text-xs text-gray-500 mt-1">Send this link to family members so they can join.</p>
                </div>
                
                <div className="flex space-x-2">
                   <input 
                      type="text" 
                      readOnly 
                      value={inviteUrl} 
                      className="flex-1 block w-full border-gray-300 rounded-md text-sm text-gray-500 bg-gray-100 px-3"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                   />
                   <Button variant="secondary" size="sm" onClick={copyToClipboard} className="w-24">
                      {copied ? <span className="flex items-center text-green-600"><Check size={14} className="mr-1"/> Copied</span> : <span className="flex items-center"><Copy size={14} className="mr-1"/> Copy</span>}
                   </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <Button variant="primary" size="sm" onClick={shareNative} className="w-full flex items-center justify-center">
                      <Share2 size={14} className="mr-2" /> Share App
                   </Button>
                   <Button variant="secondary" size="sm" onClick={emailInvite} className="w-full flex items-center justify-center">
                      <Mail size={14} className="mr-2" /> Email Invite
                   </Button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Current Habits</h3>
              <ul className="divide-y divide-gray-100">
                {habits.map(habit => (
                  <li key={habit.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{habit.name}</span>
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{habit.category}</span>
                      <span className="ml-2 text-xs text-indigo-600 font-bold">{habit.points} pts</span>
                    </div>
                    <button onClick={() => onRemoveHabit(habit.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <form onSubmit={handleAddHabit} className="border-t border-gray-100 pt-6">
               <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Add Manual Habit</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Habit Name</label>
                    <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900" placeholder="e.g. Meditate 10m" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Points</label>
                    <input type="number" value={newHabitPoints} onChange={e => setNewHabitPoints(Number(e.target.value))} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900" min="1" max="50" />
                  </div>
                  <div>
                     <Button type="submit" className="w-full">Add Habit</Button>
                  </div>
               </div>
            </form>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Manage Teams</h3>
              <div className="space-y-3 mb-6">
                {teams.sort((a,b) => a.order - b.order).map((team, index) => (
                  <div key={team.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex flex-col">
                       <button 
                         onClick={() => handleMoveTeam(index, 'up')}
                         disabled={index === 0}
                         className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                       >
                         <ArrowUp size={14} />
                       </button>
                       <button 
                         onClick={() => handleMoveTeam(index, 'down')}
                         disabled={index === teams.length - 1}
                         className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                       >
                         <ArrowDown size={14} />
                       </button>
                    </div>
                    <div className="flex flex-col items-center">
                        <label className="text-[10px] text-gray-400 font-bold uppercase mb-1">Color</label>
                        <input 
                            type="color" 
                            value={team.color} 
                            onChange={(e) => onUpdateTeam({...team, color: e.target.value})}
                            className="h-8 w-8 rounded cursor-pointer border-none p-0 bg-transparent"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Team Name</label>
                        <input 
                            type="text" 
                            value={team.name}
                            onChange={(e) => onUpdateTeam({...team, name: e.target.value})}
                            className="w-full bg-white border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                    </div>
                    <div className="pt-4">
                        <button 
                            onClick={() => onRemoveTeam(team.id)} 
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Team"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddTeam} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <h4 className="text-xs font-bold text-gray-700 mb-3">Create New Team</h4>
                 <div className="flex space-x-3">
                   <div className="flex flex-col">
                      <input 
                          type="color" 
                          value={newTeamColor} 
                          onChange={(e) => setNewTeamColor(e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer border-none p-0 bg-transparent"
                        />
                   </div>
                    <input 
                      type="text" 
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Team Name"
                      className="flex-1 border border-gray-300 rounded-md px-3 text-sm bg-white text-gray-900"
                      required
                    />
                    <Button type="submit" size="sm">
                       <Plus size={16} className="mr-1" /> Add
                    </Button>
                 </div>
              </form>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">User Assignments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Assignment</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap flex items-center">
                           <img className="h-8 w-8 rounded-full mr-3" src={user.avatarUrl} alt="" />
                           <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <select 
                            value={user.teamId || ''} 
                            onChange={(e) => onUpdateUserTeam(user.id, e.target.value)}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="">Unassigned</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
