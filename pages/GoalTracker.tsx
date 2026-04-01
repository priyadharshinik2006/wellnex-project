import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Role, StudentProfile } from '../types';
import { getCurrentUser, getGoalHabits, addBackendGoalHabit, updateBackendGoalHabit, deleteBackendGoalHabit } from '../services/storageService';

interface Habit {
  id: string;
  name: string;
  category: string;
  completedDays: boolean[]; // Array of 7 booleans for Mon-Sun
  streak: number;
}

const GoalTracker: React.FC = () => {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState("Health");

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const CATEGORIES = ['Health', 'Academic', 'Mental', 'Social'];

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.STUDENT) {
      setUser(currentUser);
      setHabits(getGoalHabits());
    }
  }, []);

  const handleAddHabit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newHabitName.trim()) return;
      
      try {
          const res = await addBackendGoalHabit(newHabitName, newHabitCategory);
          setHabits([...habits, res]);
          setNewHabitName("");
      } catch (err) {
          alert("Failed to create habit.");
      }
  };

  const toggleDay = async (habitId: string, dayIndex: number) => {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const newDays = [...habit.completedDays];
      newDays[dayIndex] = !newDays[dayIndex];
      
      let newStreak = 0;
      for (let i = 6; i >= 0; i--) {
          if (newDays[i]) newStreak++;
          else break;
      }

      try {
          await updateBackendGoalHabit(habitId, newDays, newStreak);
          setHabits(habits.map(h => h.id === habitId ? { ...h, completedDays: newDays, streak: newStreak } : h));
      } catch (err) {
          alert("Failed to update habit.");
      }
  };

  const deleteHabit = async (habitId: string) => {
      try {
          await deleteBackendGoalHabit(habitId);
          setHabits(habits.filter(h => h.id !== habitId));
      } catch (err) {
          alert("Failed to delete habit.");
      }
  };

  const getCategoryColor = (category: string) => {
      switch (category) {
          case 'Health': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'Academic': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Mental': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'Social': return 'bg-orange-100 text-orange-700 border-orange-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  if (!user) return null;

  return (
    <Layout userRole={Role.STUDENT} userName={user.name}>
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
             <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Habits & Goals</h1>
                <p className="text-slate-500 mt-1">Small daily actions lead to massive positive changes.</p>
             </div>
             <div className="mt-4 md:mt-0 flex items-center bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <i className="fas fa-fire text-orange-500 mr-2"></i>
                <span className="font-bold text-slate-700 text-sm">Active Streaks: {habits.filter(h => h.streak > 0).length}</span>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Add Habit Sidebar */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center text-sm uppercase tracking-widest opacity-80">
                       <i className="fas fa-plus-circle mr-2 text-indigo-500"></i> New Habit
                    </h3>
                    <form onSubmit={handleAddHabit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Habit Name</label>
                            <input 
                                type="text" 
                                value={newHabitName}
                                onChange={e => setNewHabitName(e.target.value)}
                                placeholder="e.g. Read 10 pages"
                                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                            <select 
                                value={newHabitCategory}
                                onChange={e => setNewHabitCategory(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <button 
                            type="submit"
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                        >
                            Create Habit
                        </button>
                    </form>
                </div>
            </div>

            {/* Habits Grid */}
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6 hidden md:flex">
                        <div className="w-1/3"></div>
                        <div className="w-2/3 flex justify-between pr-12">
                            {DAYS.map(day => (
                                <span key={day} className="text-xs font-bold text-gray-400 uppercase w-10 text-center">{day}</span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {habits.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <i className="fas fa-calendar-check text-4xl mb-3 text-gray-300"></i>
                                <p className="font-semibold text-gray-500">No habits tracked yet.</p>
                            </div>
                        ) : (
                            habits.map(habit => (
                                <div key={habit.id} className="flex flex-col md:flex-row items-start md:items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group relative">
                                    <button 
                                        onClick={() => deleteHabit(habit.id)}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-500 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                    
                                    <div className="w-full md:w-1/3 mb-4 md:mb-0 pr-4">
                                        <h4 className="font-bold text-slate-800 text-sm">{habit.name}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryColor(habit.category)}`}>
                                                {habit.category}
                                            </span>
                                            {habit.streak > 0 && (
                                                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md flex items-center">
                                                    <i className="fas fa-fire mr-1"></i> {habit.streak}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-2/3 flex justify-between md:pr-12">
                                        {habit.completedDays.map((isCompleted, index) => (
                                            <div key={index} className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 md:hidden">{DAYS[index]}</span>
                                                <button 
                                                    onClick={() => toggleDay(habit.id, index)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCompleted ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200 scale-105' : 'bg-white text-gray-300 hover:bg-gray-100 border-2 border-dashed border-gray-200'}`}
                                                >
                                                    {isCompleted && <i className="fas fa-check"></i>}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </Layout>
  );
};

export default GoalTracker;
