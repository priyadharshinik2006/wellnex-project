import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getCurrentUser, getStudentSurveys } from '../services/storageService';
import { StudentProfile, WellnessSurvey, Role } from '../types';
import Chatbot from '../components/Chatbot';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';

const WellnessInsights: React.FC = () => {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [surveys, setSurveys] = useState<WellnessSurvey[]>([]);
  const [insightReport, setInsightReport] = useState<{
    score: number;
    status: string;
    observations: string[];
    actionItems: string[];
  } | null>(null);
  const [trends, setTrends] = useState({ stressDiff: 0, sleepDiff: 0 });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.STUDENT) {
      setUser(currentUser);
      const data = getStudentSurveys(currentUser.rollNumber);
      setSurveys(data);
      if (data.length > 0) {
        generateDetailedInsights(data);
      }
    }
  }, []);

  const calculateWellnessScore = (s: WellnessSurvey) => {
    // Score out of 100. 
    // Stress: Lower is better (10-val)
    // Sleep: Higher is better (val)
    // Pressure: Lower is better (10-val)
    const stressComp = (10 - s.stressLevel) * 10; // 0-90
    const sleepComp = s.sleepQuality * 10; // 10-100
    const pressureComp = (10 - s.academicPressure) * 10; // 0-90
    
    // Weighted average: Sleep 40%, Stress 30%, Pressure 30%
    const score = (sleepComp * 0.4) + (stressComp * 0.3) + (pressureComp * 0.3);
    return Math.round(score);
  };

  const generateDetailedInsights = (data: WellnessSurvey[]) => {
    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp); // Oldest first
    const current = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : current;

    // 1. Calculate Score
    const currentScore = calculateWellnessScore(current);
    let status = 'Stable';
    if (currentScore >= 80) status = 'Thriving';
    else if (currentScore >= 50) status = 'Managing';
    else status = 'At Risk';

    // 2. Trend Calc
    const stressDiff = sorted.length > 1 ? Math.round(((current.stressLevel - previous.stressLevel) / (previous.stressLevel || 1)) * 100) : 0;
    const sleepDiff = sorted.length > 1 ? Math.round(((current.sleepQuality - previous.sleepQuality) / (previous.sleepQuality || 1)) * 100) : 0;
    setTrends({ stressDiff, sleepDiff });

    // 3. Observations & Actions
    const obs: string[] = [];
    const acts: string[] = [];

    // Stress Analysis
    if (current.stressLevel >= 8) {
        obs.push("Stress levels are critically high, impacting overall wellness score.");
        acts.push("Immediate: Practice Box Breathing (4-4-4-4) before study sessions.");
    } else if (stressDiff > 20) {
        obs.push("There is a rapid spike in stress compared to your last check-in.");
        acts.push("Identify recent triggers and schedule a 30-minute disconnection break.");
    }

    // Sleep Analysis
    if (current.sleepQuality <= 4) {
        obs.push("Sleep quality is suboptimal, likely reducing cognitive recovery.");
        acts.push("Enforce a strict lights-out policy by 11:00 PM.");
    } else if (current.sleepQuality >= 8) {
        obs.push("Excellent sleep hygiene is acting as a strong buffer against stress.");
    }

    // Academic Pressure
    if (current.academicPressure > current.sleepQuality) {
        obs.push("Academic pressure is outweighing your recovery (sleep) metrics.");
        acts.push("Review study schedule: Ensure high-focus tasks are done in morning hours.");
    }

    // Default if healthy
    if (obs.length === 0) obs.push("All metrics are within a healthy, sustainable range.");
    if (acts.length === 0) acts.push("Maintain current routine. Consider increasing hydration.");

    setInsightReport({
        score: currentScore,
        status,
        observations: obs,
        actionItems: acts
    });
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Loading wellness profile...</div>;

  // Chart Data Preparation
  const chartData = [...surveys].reverse().map(s => ({
    date: s.date.slice(0, 5),
    score: calculateWellnessScore(s),
    stress: s.stressLevel,
    sleep: s.sleepQuality
  }));

  // Radar Data (Latest)
  const latest = surveys[0] || { stressLevel: 5, sleepQuality: 5, academicPressure: 5 };
  const radarData = [
    { subject: 'Mental Ease', A: (10 - latest.stressLevel) * 10, fullMark: 100 },
    { subject: 'Sleep Quality', A: latest.sleepQuality * 10, fullMark: 100 },
    { subject: 'Academic Control', A: (10 - latest.academicPressure) * 10, fullMark: 100 },
  ];

  return (
    <Layout userRole={Role.STUDENT} userName={user.name}>
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
             <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Wellness Intelligence</h1>
                <p className="text-slate-500 mt-1">Advanced analytics and predictive health modeling.</p>
             </div>
             <div className="mt-4 md:mt-0">
                 <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                    <i className="fas fa-calendar-alt mr-2"></i> Last 30 Days
                 </span>
             </div>
        </div>

        {/* Hero Section: Wellness Score & Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-80">Wellness Score</h2>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-7xl font-extrabold tracking-tighter">
                            {insightReport ? insightReport.score : '--'}
                        </span>
                        <span className="text-2xl opacity-60 ml-2">/100</span>
                    </div>
                    <div className={`mt-2 inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase bg-white/20 backdrop-blur-sm`}>
                        {insightReport ? insightReport.status : 'Analyzing...'}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="opacity-80">Stress Delta</span>
                        <span className={`font-bold ${trends.stressDiff > 0 ? 'text-red-200' : 'text-green-200'}`}>
                            {trends.stressDiff > 0 ? '+' : ''}{trends.stressDiff}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="opacity-80">Sleep Delta</span>
                        <span className={`font-bold ${trends.sleepDiff < 0 ? 'text-red-200' : 'text-green-200'}`}>
                             {trends.sleepDiff > 0 ? '+' : ''}{trends.sleepDiff}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Radar Analysis */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center">
                <div className="flex-1 w-full h-64">
                    <h3 className="font-bold text-slate-700 mb-2 ml-4">Wellness Balance Profile</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Current Status" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.3} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/3 p-4 bg-gray-50 rounded-2xl text-sm space-y-4">
                    <div>
                        <div className="font-bold text-slate-700 mb-1">Mental Ease</div>
                        <p className="text-gray-500 text-xs">Capacity to handle stress loads without burnout.</p>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                             <div className="bg-indigo-400 h-1.5 rounded-full" style={{width: `${radarData[0].A}%`}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 mb-1">Physical Rest</div>
                        <p className="text-gray-500 text-xs">Recovery level based on sleep quality.</p>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                             <div className="bg-blue-400 h-1.5 rounded-full" style={{width: `${radarData[1].A}%`}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 mb-1">Academic Control</div>
                        <p className="text-gray-500 text-xs">Perception of academic workload manageability.</p>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                             <div className="bg-teal-400 h-1.5 rounded-full" style={{width: `${radarData[2].A}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* AI Report */}
        {insightReport && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-indigo-50 px-8 py-4 border-b border-indigo-100 flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-3">
                        <i className="fas fa-microchip"></i>
                    </div>
                    <h3 className="font-bold text-indigo-900">AI Wellness Intelligence Report</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Key Observations</h4>
                        <ul className="space-y-4">
                            {insightReport.observations.map((obs, idx) => (
                                <li key={idx} className="flex items-start">
                                    <i className="fas fa-info-circle text-blue-400 mt-1 mr-3 shrink-0"></i>
                                    <p className="text-slate-700 font-medium">{obs}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                         <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recommended Actions</h4>
                         <div className="space-y-3">
                            {insightReport.actionItems.map((act, idx) => (
                                <div key={idx} className="flex items-center p-3 bg-green-50 rounded-xl border border-green-100">
                                    <i className="fas fa-check text-green-500 mr-3"></i>
                                    <p className="text-green-800 text-sm font-semibold">{act}</p>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* Trend Graph */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Wellness Score Progression</h3>
            <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorScore)" name="Wellness Score" />
                    </AreaChart>
                 </ResponsiveContainer>
            </div>
        </div>

      </div>
      <Chatbot />
    </Layout>
  );
};

export default WellnessInsights;