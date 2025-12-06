import { GoogleGenAI } from "@google/genai";
import { User, Habit, Log, Team } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateCoachFeedback = async (
  user: User, 
  logs: Log[], 
  habits: Habit[], 
  teams: Team[],
  teamRank: number
): Promise<string> => {
  if (!ai) return "AI Configuration Missing: Please set your API Key to enable the AI Coach.";

  const userLogs = logs.filter(l => l.userId === user.id);
  const totalPoints = userLogs.reduce((acc, log) => {
    const habit = habits.find(h => h.id === log.habitId);
    return acc + (habit ? habit.points : 0);
  }, 0);

  const prompt = `
    Act as a high-energy, motivational habit coach. 
    Analyze the following data for a user named ${user.name} participating in a "Family Habit Challenge".
    
    Data:
    - Total Points Scored: ${totalPoints}
    - Total Habits Completed: ${userLogs.length}
    - Team Name: ${teams.find(t => t.id === user.teamId)?.name || 'No Team'}
    - Current Team Rank: ${teamRank}
    
    The user wants to improve. Give 3 short, punchy, specific bullet points of advice or motivation.
    Keep it under 100 words total. Use emojis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Keep pushing! You're doing great!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Great job keeping up with your habits! Consistency is key.";
  }
};

export const generateHabitSuggestions = async (currentHabits: Habit[]): Promise<Habit[]> => {
  if (!ai) return [];

  const prompt = `
    We are running a family habit challenge. 
    Current habits include: ${currentHabits.map(h => h.name).join(', ')}.
    
    Generate 3 NEW, unique, fun, and healthy habits that would be good for a group challenge.
    Return ONLY a valid JSON array of objects with keys: name, description, points (number 1-10), category (health, fitness, mindfulness, productivity, or other).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text || "[]";
    const newHabits = JSON.parse(text);
    return newHabits.map((h: any, i: number) => ({
      ...h,
      id: `gen_${Date.now()}_${i}`
    }));
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
