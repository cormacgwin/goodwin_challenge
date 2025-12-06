
import { User, Habit, Log, Team } from "../types";

// This file is stubbed out to prevent build errors since we removed AI features.
export const generateCoachFeedback = async (
  user: User, 
  logs: Log[], 
  habits: Habit[], 
  teams: Team[],
  teamRank: number
): Promise<string> => {
  return "";
};

export const generateHabitSuggestions = async (currentHabits: Habit[]): Promise<Habit[]> => {
  return [];
};
