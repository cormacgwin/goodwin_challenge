import React, { useState } from 'react';
import { ChallengeSettings, Habit, User, Team } from '../types';
import { Button } from './Button';
import { Trash2, Plus, Calendar, Settings } from 'lucide-react';

interface AdminPanelProps {
  settings: ChallengeSettings;
  habits: Habit[];
  teams: Team[];
  users: User[];
  onUpdateSettings: (s: ChallengeSettings) => void;
  onAddHabit: (h: Habit) => void;
  onRemoveHabit: (id: string) => void;
  onUpdateUserTeam: (userId: string, teamId: string) => void;
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
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'habits' | 'teams'>('settings');
  
  // Local state for new habit form
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitPoints, setNewHabitPoints] = useState(5);
  const [newHabitCat, setNewHabitCat] = useState<Habit['category']>('health');

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
            <div className="grid grid-cols-2 gap-4">
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
             <div className="flex items-center justify-between py-4 bg-gray-50 px-4 rounded-lg">
                <div>
                   <h4 className="text-sm font-bold text-gray-900">Invite Link</h4>
                   <p className="text-xs text-gray-500">Share this with family to join.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => alert("Copied to clipboard: https://habitsync.app/join/family-123")}>
                   Copy Link
                </Button>
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
          <div>
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
        )}
      </div>
    </div>
  );
};