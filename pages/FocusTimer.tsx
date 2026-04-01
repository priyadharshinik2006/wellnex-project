import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Role, StudentProfile } from '../types';
import { getCurrentUser, getFocusTasks, addBackendFocusTask, toggleBackendFocusTask, deleteBackendFocusTask } from '../services/storageService';

const FocusTimer: React.FC = () => {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [audioPlayed, setAudioPlayed] = useState<HTMLAudioElement | null>(null);
  const [selectedSound, setSelectedSound] = useState<string>('none');
  const [tasks, setTasks] = useState<{id: string, text: string, completed: boolean}[]>([]);
  const [newTask, setNewTask] = useState("");

  const SOUND_OPTIONS = [
    { id: 'none', label: 'No Sound', icon: 'fa-volume-mute' },
    { id: 'rain', label: 'Rain', icon: 'fa-cloud-rain', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3d1ef3f48k.mp3' }, // Placeholder URLs
    { id: 'cafe', label: 'Cafe', icon: 'fa-coffee', url: 'https://cdn.pixabay.com/download/audio/2022/07/26/audio_24564c7t3d.mp3' },
    { id: 'zen', label: 'Zen', icon: 'fa-om', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_8b2ed3f25h.mp3' }
  ];

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.STUDENT) {
      setUser(currentUser);
      setTasks(getFocusTasks());
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a notification sound
      if (mode === 'FOCUS') {
          alert('Focus session complete! Time for a short break.');
          setMode('BREAK');
          setTimeLeft(5 * 60);
      } else {
          alert('Break is over! Ready to focus?');
          setMode('FOCUS');
          setTimeLeft(25 * 60);
      }
    }
    
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, mode]);

  useEffect(() => {
      if (audioPlayed) {
          audioPlayed.pause();
      }
      if (selectedSound !== 'none' && isActive) {
          const soundOpt = SOUND_OPTIONS.find(s => s.id === selectedSound);
          if (soundOpt && soundOpt.url) {
              const audio = new Audio(soundOpt.url);
              audio.loop = true;
              audio.volume = 0.5;
              audio.play().catch(e => console.log('Audio play failed', e));
              setAudioPlayed(audio);
          }
      }
      return () => {
          if (audioPlayed) audioPlayed.pause();
      };
  }, [selectedSound, isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const handleSetMode = (newMode: 'FOCUS' | 'BREAK') => {
      setMode(newMode);
      setIsActive(false);
      setTimeLeft(newMode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addTask = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTask.trim()) return;
      try {
          const res = await addBackendFocusTask(newTask);
          setTasks([res, ...tasks]);
          setNewTask("");
      } catch (err) {
          alert("Failed to add task.");
      }
  };
  
  const toggleTask = async (id: string, currentStatus: boolean) => {
      try {
          await toggleBackendFocusTask(id, !currentStatus);
          setTasks(tasks.map(t => t.id === id ? {...t, completed: !currentStatus} : t));
      } catch (err) {
          alert("Failed to update task.");
      }
  };

  const deleteTask = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
          await deleteBackendFocusTask(id);
          setTasks(tasks.filter(t => t.id !== id));
      } catch (err) {
          alert("Failed to delete task.");
      }
  };

  if (!user) return null;

  const bgGradient = mode === 'FOCUS' ? 'from-orange-500 to-red-600' : 'from-teal-400 to-emerald-500';

  return (
    <Layout userRole={Role.STUDENT} userName={user.name}>
      <div className="max-w-5xl mx-auto space-y-8 pb-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
             <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Focus & Flow</h1>
                <p className="text-slate-500 mt-1">Manage your energy, not just your time.</p>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Timer Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-10 w-64">
                        <button 
                            onClick={() => handleSetMode('FOCUS')}
                            className={`flex-1 py-2 font-bold text-sm outline-none rounded-xl transition-all ${mode === 'FOCUS' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Focus
                        </button>
                        <button 
                            onClick={() => handleSetMode('BREAK')}
                            className={`flex-1 py-2 font-bold text-sm outline-none rounded-xl transition-all ${mode === 'BREAK' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Break
                        </button>
                    </div>

                    <div className={`w-72 h-72 rounded-full flex items-center justify-center bg-gradient-to-br ${bgGradient} text-white shadow-xl shadow-current/20 relative`}>
                        {/* Outer pulsing ring when active */}
                        {isActive && (
                             <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></div>
                        )}
                        <span className="text-6xl font-black font-mono tracking-tighter relative z-10 drop-shadow-md">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <div className="flex items-center gap-6 mt-12">
                        <button onClick={resetTimer} className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition-colors">
                            <i className="fas fa-redo"></i>
                        </button>
                        <button 
                            onClick={toggleTimer} 
                            className={`px-12 py-4 rounded-full font-black tracking-widest uppercase text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isActive ? 'bg-gray-800' : (mode === 'FOCUS' ? 'bg-orange-600' : 'bg-teal-500')}`}
                        >
                            {isActive ? 'Pause' : 'Start'}
                        </button>
                    </div>
                </div>

                {/* Ambient Sound Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center text-sm uppercase tracking-widest opacity-80">
                        <i className="fas fa-headphones-alt mr-2 text-indigo-500"></i> Ambient Sound
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {SOUND_OPTIONS.map(opt => (
                            <button 
                                key={opt.id}
                                onClick={() => setSelectedSound(opt.id)}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${selectedSound === opt.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-500 hover:border-indigo-200'}`}
                            >
                                <i className={`fas ${opt.icon} text-2xl`}></i>
                                <span className="font-bold text-sm">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tasks Section */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col h-full max-h-[800px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center text-sm uppercase tracking-widest opacity-80">
                   <i className="fas fa-tasks mr-2 text-blue-500"></i> Current Session Tasks
                </h3>
                
                <form onSubmit={addTask} className="mb-6">
                    <input 
                        type="text" 
                        placeholder="What are you working on?" 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </form>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {tasks.length === 0 ? (
                        <div className="text-center py-10 opacity-40">
                            <i className="fas fa-clipboard-list text-3xl mb-2"></i>
                            <p className="text-sm font-bold">No tasks added yet.</p>
                            <p className="text-xs">Add a task to stay focused.</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => toggleTask(task.id, task.completed)}
                                className={`flex items-center justify-between gap-3 p-4 rounded-2xl cursor-pointer transition-all ${task.completed ? 'bg-gray-50 opacity-50' : 'bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${task.completed ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-blue-200 text-transparent'}`}>
                                        <i className="fas fa-check text-xs"></i>
                                    </div>
                                    <span className={`font-semibold text-sm ${task.completed ? 'line-through text-gray-500' : 'text-slate-700'}`}>
                                        {task.text}
                                    </span>
                                </div>
                                <button 
                                    onClick={(e) => deleteTask(e, task.id)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                >
                                    <i className="fas fa-trash-alt text-xs"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default FocusTimer;
