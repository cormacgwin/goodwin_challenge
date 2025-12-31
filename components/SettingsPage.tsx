
import React, { useState, useRef } from 'react';
import { User, Habit } from '../types';
import { Button } from './Button';
import { LogOut, Trash2, CheckCircle2, Circle, AlertCircle, Save, UserCircle, Camera } from 'lucide-react';

interface SettingsPageProps {
  user: User;
  allHabits: Habit[];
  onUpdateName: (name: string) => void;
  onUpdateAvatar: (url: string) => void;
  onUpdateHabits: (habitIds: string[]) => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  user, 
  allHabits, 
  onUpdateName,
  onUpdateAvatar,
  onUpdateHabits, 
  onDeleteAccount, 
  onLogout 
}) => {
  const [name, setName] = useState(user.name);
  const [selectedHabits, setSelectedHabits] = useState<string[]>(user.habitIds || []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleHabitSelection = (habitId: string) => {
    if (selectedHabits.includes(habitId)) {
      setSelectedHabits(prev => prev.filter(id => id !== habitId));
    } else if (selectedHabits.length < 5) {
      setSelectedHabits(prev => [...prev, habitId]);
    }
  };

  const handleSaveHabits = () => {
    if (selectedHabits.length === 5) {
      onUpdateHabits(selectedHabits);
    }
  };

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
          let width = img.width, height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          onUpdateAvatar(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
           <UserCircle size={24} />
        </div>
        <div>
           <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Habit Selection & Profile</p>
        </div>
      </div>

      {/* Account Profile Management */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
        <div className="relative inline-block mb-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-24 w-24 rounded-full bg-gray-50 border-4 border-white shadow-xl object-cover" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center text-2xl text-indigo-300 font-black">
              {user.name.charAt(0)}
            </div>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-xl shadow-lg border-2 border-white text-white hover:scale-110 transition-transform"
          >
            <Camera size={14} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        <div className="w-full max-w-sm">
           <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Display Name</label>
           <div className="flex space-x-2">
             <input 
               type="text" 
               value={name} 
               onChange={(e) => { setName(e.target.value); setIsEditingName(true); }} 
               className="block flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
             />
             <Button 
               onClick={() => { onUpdateName(name); setIsEditingName(false); }} 
               className="px-4 py-2 rounded-xl" 
               disabled={!isEditingName}
               size="sm"
             >
               Save
             </Button>
           </div>
        </div>
      </div>

      {/* Habit Selection Logic */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Pick Your 5 Habits</h3>
           <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${selectedHabits.length === 5 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {selectedHabits.length} / 5 Selected
           </span>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 flex items-start">
           <AlertCircle size={18} className="text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
           <p className="text-xs text-orange-800 font-medium leading-relaxed">
             <strong>Selection Policy:</strong> Habit choices are locked once saved. Ensure these 5 habits are exactly what you want to track for the remainder of the challenge.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
           {allHabits.map(habit => {
             const isSelected = selectedHabits.includes(habit.id);
             const isMaxed = selectedHabits.length >= 5 && !isSelected;
             return (
               <button
                 key={habit.id}
                 onClick={() => toggleHabitSelection(habit.id)}
                 disabled={isMaxed}
                 className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                   isSelected 
                     ? 'bg-indigo-50 border-indigo-600 shadow-sm' 
                     : isMaxed ? 'opacity-50 cursor-not-allowed border-gray-100' : 'bg-white border-gray-100 hover:border-indigo-200'
                 }`}
               >
                 <div className="flex items-center">
                    <div className={`mr-3 ${isSelected ? 'text-indigo-600' : 'text-gray-300'}`}>
                       {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{habit.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{habit.points} pts • {habit.category}</p>
                    </div>
                 </div>
               </button>
             );
           })}
        </div>

        <Button 
          onClick={handleSaveHabits} 
          className="w-full py-4 text-base font-black shadow-lg shadow-indigo-100 rounded-2xl"
          disabled={selectedHabits.length !== 5}
        >
          Confirm My Habit Selection
        </Button>
      </div>

      {/* Logout and Delete */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-3">
        <button onClick={onLogout} className="w-full flex items-center justify-center p-4 text-sm font-black text-gray-600 hover:text-indigo-600 bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100">
          <LogOut size={18} className="mr-2" /> Sign Out
        </button>
        <button onClick={() => setIsDeleting(true)} className="w-full p-4 text-[10px] font-black text-red-400 hover:text-red-600 transition-all uppercase tracking-widest">
          Delete My Account
        </button>
      </div>

      {isDeleting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-black text-gray-900 mb-2">Are you sure?</h2>
            <p className="text-sm text-gray-500 mb-8">This action is permanent and will erase all your stats.</p>
            <div className="flex flex-col space-y-3">
              <Button onClick={onDeleteAccount} variant="danger" className="py-3 rounded-xl">Confirm Delete</Button>
              <button onClick={() => setIsDeleting(false)} className="text-sm font-bold text-gray-400 hover:text-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
