
import React, { useState, useRef } from 'react';
import { User, Log, Habit, ChallengeSettings } from '../types';
import { Button } from './Button';
import { Camera, LogOut, Trash2, Save, User as UserIcon } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateAvatar: (url: string) => void;
  onUpdateName: (name: string) => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  onUpdateAvatar,
  onUpdateName,
  onDeleteAccount,
  onLogout
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleSaveName = () => {
    onUpdateName(name);
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-2">Manage your profile details and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* AVATAR SECTION */}
        <div className="p-8 border-b border-gray-100 flex flex-col items-center">
            <div className="relative group mb-6">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-32 w-32 rounded-full bg-gray-100 border-4 border-white shadow-md object-cover" />
                ) : (
                    <div className="h-32 w-32 rounded-full bg-gray-200 border-4 border-white shadow-md flex items-center justify-center">
                        <span className="text-5xl text-gray-400 font-bold">{user.name.charAt(0)}</span>
                    </div>
                )}
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-0 bg-indigo-600 p-2.5 rounded-full shadow-lg border-2 border-white text-white hover:bg-indigo-700 transition-transform hover:scale-105"
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
            <p className="text-sm text-gray-400">Click the camera icon to upload a photo from your library.</p>
        </div>

        {/* DETAILS SECTION */}
        <div className="p-8 space-y-6">
            
            {/* Name Input */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                <div className="flex space-x-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon size={16} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setIsEditing(true);
                            }}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
                        />
                    </div>
                    {isEditing && (
                        <Button onClick={handleSaveName} size="sm">
                            <Save size={16} className="mr-2" /> Save
                        </Button>
                    )}
                </div>
            </div>

            {/* Email (Read Only) */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                    type="text" 
                    value={user.email}
                    disabled
                    className="block w-full border border-gray-200 bg-gray-50 rounded-lg py-2 px-3 text-gray-500 sm:text-sm cursor-not-allowed"
                />
            </div>

             {/* Role (Read Only) */}
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {user.role}
                </span>
            </div>
        </div>

        {/* ACTIONS FOOTER */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex flex-col space-y-4">
             <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
             >
                <LogOut size={16} className="mr-2" /> Sign Out
             </button>

             <div className="border-t border-gray-200 pt-4 mt-2">
                {!isDeleting ? (
                    <button 
                        onClick={() => setIsDeleting(true)}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} className="mr-2" /> Delete Account
                    </button>
                ) : (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                        <p className="text-red-800 font-medium text-sm mb-3">Are you sure? This cannot be undone.</p>
                        <div className="flex space-x-3 justify-center">
                            <button 
                                onClick={() => setIsDeleting(false)}
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={onDeleteAccount}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-medium shadow-sm"
                            >
                                Yes, Delete My Account
                            </button>
                        </div>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};
