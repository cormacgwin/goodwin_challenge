import React, { useState } from 'react';
import { User, Log, Habit, Team } from '../types';
import { generateCoachFeedback } from '../services/geminiService';
import { Button } from './Button';
import { MessageSquareQuote, Loader2 } from 'lucide-react';

interface AIInsightsProps {
  user: User;
  logs: Log[];
  habits: Habit[];
  teams: Team[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ user, logs, habits, teams }) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetCoaching = async () => {
    setLoading(true);
    // Calculate simple rank logic
    const team = teams.find(t => t.id === user.teamId);
    // This is a simplified rank passing for the prompt
    const feedbackText = await generateCoachFeedback(user, logs, habits, teams, 1);
    setFeedback(feedbackText);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center">
             <MessageSquareQuote className="mr-2" /> Coach's Corner
          </h2>
          <p className="text-indigo-200 text-sm mt-1">Get personalized AI motivation based on your recent activity.</p>
        </div>
      </div>

      <div className="mt-6">
        {feedback ? (
           <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
             <div className="prose prose-invert prose-sm">
                <p className="whitespace-pre-line leading-relaxed">{feedback}</p>
             </div>
             <button 
               onClick={() => setFeedback(null)} 
               className="mt-4 text-xs text-indigo-200 hover:text-white underline"
             >
               Clear Feedback
             </button>
           </div>
        ) : (
          <div className="text-center py-4">
             <Button 
               onClick={handleGetCoaching} 
               isLoading={loading}
               className="bg-white text-indigo-900 hover:bg-indigo-50 border-none w-full sm:w-auto"
             >
               {loading ? 'Analyzing Stats...' : 'Analyze My Progress'}
             </Button>
          </div>
        )}
      </div>
    </div>
  );
};
