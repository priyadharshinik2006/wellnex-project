import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCurrentUser, getStudentSurveys, saveSurvey } from '../services/storageService';
import { StudentProfile, WellnessSurvey, Role, Recommendation } from '../types';
import { MOODS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Chatbot from '../components/Chatbot';

const StudentSurvey: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [surveys, setSurveys] = useState<WellnessSurvey[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [showResult, setShowResult] = useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);

  // Survey Form
  const [surveyForm, setSurveyForm] = useState({
    stress: 5,
    sleep: 5,
    pressure: 5,
    mood: MOODS[0],
    remarks: ''
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.STUDENT) {
      setUser(currentUser);
      const data = getStudentSurveys(currentUser.rollNumber);
      setSurveys(data);
    }
  }, []);

  const generateRecommendation = (stress: number) => {
    let rec: Recommendation;
    if (stress <= 4) {
      rec = { 
        category: 'General', 
        message: "You seem to be in a good mental space right now! Keep up the great work. Continuing to maintain a balanced routine is key to long-term wellness. Consider engaging in proactive habits like regular journaling, maintaining a steady workout schedule, and ensuring you get 7-9 hours of consistent sleep tonight to preserve your current resilience.", 
        isUrgent: false 
      };
    } else if (stress <= 7) {
      rec = { 
        category: 'Time Management', 
        message: "It looks like you're handling some moderate pressure. To stay on top of things, try prioritizing your tasks using the Eisenhower Matrix (categorizing by urgency and importance). Taking short, regular screen-free breaks—such as a 5-minute walk or stretching every hour—can help recharge your focus and lower cortisol levels.", 
        isUrgent: false 
      };
    } else {
      rec = { 
        category: 'Professional Help', 
        message: "Your stress levels are currently very high, which can significantly impact your academic performance and physical health over time. We strongly recommend speaking with a campus counselor. In the immediate term, practice the 4-7-8 breathing technique (inhale for 4s, hold for 7s, exhale for 8s) to quickly calm your nervous system.", 
        isUrgent: true 
      };
    }
    setRecommendation(rec);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const now = new Date();
    const newSurvey: WellnessSurvey = {
      id: crypto.randomUUID(),
      studentRollNumber: user.rollNumber,
      stressLevel: surveyForm.stress,
      sleepQuality: surveyForm.sleep,
      academicPressure: surveyForm.pressure,
      mood: surveyForm.mood,
      remarks: surveyForm.remarks,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      timestamp: now.getTime()
    };

    saveSurvey(newSurvey);
    
    
    // The backend now securely calculates risk and sends the email automatically inside saveSurvey.
    
    // Update local state for graph and recommendation
    const updatedSurveys = getStudentSurveys(user.rollNumber);
    setSurveys(updatedSurveys);
    generateRecommendation(surveyForm.stress);
    setShowResult(true);
    
    // Check for critical condition: Stress > 8 AND Pressure > 8 AND Sleep < 2
    // We handle the visual of this inside the recommendation box now, 
    // instead of an immediate modal overlay.

    // Scroll to the result
    setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!user) return <div>Loading...</div>;

  // Prepare chart data (reversed to show chronological left-to-right)
  const chartData = [...surveys].reverse().map(s => {
    // Handle both strict ISO dates and formatted MM/DD/YYYY dates securely
    let shortDate = s.date;
    if (s.date.includes('/')) {
        const parts = s.date.split('/');
        shortDate = `${parts[0]}/${parts[1]}`;
    } else if (s.date.length > 5) {
        shortDate = s.date.substring(5, 10); // Extract MM-DD from YYYY-MM-DD
    }

    return {
      date: shortDate,
      stress: s.stressLevel,
      sleep: s.sleepQuality,
      pressure: s.academicPressure
    };
  });

  return (
    <Layout userRole={Role.STUDENT} userName={user.name}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="mb-6">
             <h1 className="text-3xl font-bold text-slate-800">Wellness Survey</h1>
             <p className="text-slate-500">Check in with yourself. How are you feeling today?</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* Sliders Section */}
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-lg font-bold text-slate-700 flex items-center">
                                <i className="fas fa-bolt text-yellow-500 mr-2"></i> Stress Level
                            </label>
                            <span className="px-3 py-1 bg-gray-100 rounded-lg font-bold text-indigo-600">{surveyForm.stress}/10</span>
                        </div>
                        <input type="range" min="1" max="10" value={surveyForm.stress} onChange={e => setSurveyForm({...surveyForm, stress: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-300 transition-colors" />
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium"><span>Very Relaxed</span><span>Highly Stressed</span></div>
                    </div>

                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <label className="text-lg font-bold text-slate-700 flex items-center">
                                <i className="fas fa-moon text-blue-500 mr-2"></i> Sleep Quality
                            </label>
                            <span className="px-3 py-1 bg-gray-100 rounded-lg font-bold text-blue-600">{surveyForm.sleep}/10</span>
                        </div>
                        <input type="range" min="1" max="10" value={surveyForm.sleep} onChange={e => setSurveyForm({...surveyForm, sleep: parseInt(e.target.value)})} className="w-full accent-blue-500 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-300 transition-colors" />
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium"><span>Poor Sleep</span><span>Excellent Sleep</span></div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-lg font-bold text-slate-700 flex items-center">
                                <i className="fas fa-book-reader text-purple-500 mr-2"></i> Academic Pressure
                            </label>
                            <span className="px-3 py-1 bg-gray-100 rounded-lg font-bold text-purple-600">{surveyForm.pressure}/10</span>
                        </div>
                        <input type="range" min="1" max="10" value={surveyForm.pressure} onChange={e => setSurveyForm({...surveyForm, pressure: parseInt(e.target.value)})} className="w-full accent-purple-500 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-300 transition-colors" />
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium"><span>Manageable</span><span>Overwhelming</span></div>
                    </div>
                </div>

                {/* Mood Selector */}
                <div>
                    <label className="block text-lg font-bold text-slate-700 mb-4">Current Mood</label>
                    <div className="flex flex-wrap gap-3">
                        {MOODS.map(m => (
                            <button key={m} type="button" onClick={() => setSurveyForm({...surveyForm, mood: m})} 
                                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all transform hover:scale-105 ${surveyForm.mood === m ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Graph Below Form (As Requested) */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Your Recent Trends</h3>
                    <div className="h-48">
                         {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 10]} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Submit your first survey to see trends</div>
                         )}
                    </div>
                </div>

                {/* Optional Remarks */}
                <div>
                    <label className="block text-lg font-bold text-slate-700 mb-2">Optional Remarks</label>
                    <textarea rows={3} value={surveyForm.remarks} onChange={e => setSurveyForm({...surveyForm, remarks: e.target.value})} className="w-full p-4 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none bg-gray-50" placeholder="Feel free to share any specific concerns..."></textarea>
                </div>

                <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.01] transition-all transform duration-200">
                    Submit Wellness Survey
                </button>
            </form>
        </div>

        {/* Recommendation Result (Appears at Bottom after form submission) */}
        <div ref={resultRef}>
            {showResult && recommendation && (
                <div className="space-y-6">
                    <div className={`p-10 rounded-3xl border-2 shadow-xl animate-fade-in-up flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 ${recommendation.isUrgent ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center shrink-0 ${recommendation.isUrgent ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <i className={`fas ${recommendation.isUrgent ? 'fa-heart-broken' : 'fa-spa'} text-4xl`}></i>
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className={`text-2xl font-bold uppercase tracking-wide mb-3 ${recommendation.isUrgent ? 'text-red-800' : 'text-green-800'}`}>
                                Health Tip: {recommendation.category}
                            </h3>
                            <p className={`text-xl font-medium leading-relaxed ${recommendation.isUrgent ? 'text-red-700' : 'text-green-700'}`}>
                                {recommendation.message}
                            </p>
                            
                            <div className="mt-6 pt-6 border-t border-black/5">
                                 <h4 className={`font-bold text-sm uppercase tracking-wider mb-2 ${recommendation.isUrgent ? 'text-red-900/60' : 'text-green-900/60'}`}>Daily Routine Suggestion</h4>
                                 <p className={`text-lg ${recommendation.isUrgent ? 'text-red-800/80' : 'text-green-800/80'}`}>
                                    {recommendation.isUrgent 
                                        ? "Please schedule a 15-minute break every 2 hours. Step completely away from screens, do some light stretching, and focus on deep breathing exercises. Make sure you are also drinking enough water." 
                                        : "Maintain your hydration levels (aim for at least 8 glasses/day), prioritize a nutritious diet, and aim for a 30-minute walk or light exercise in the evening to naturally release endorphins."}
                                 </p>
                            </div>

                            <button onClick={() => setShowResult(false)} className="mt-6 text-sm font-bold underline opacity-60 hover:opacity-100 transition-opacity border-none bg-transparent cursor-pointer">Dismiss Recommendation</button>
                        </div>
                    </div>

                    {/* Counselor Support Appears AFTER Recommendation if Urgent */}
                    {recommendation.isUrgent && (
                        <div className="mt-8 bg-white rounded-3xl shadow-xl w-full p-8 animate-fade-in-up border-l-8 border-red-500 flex flex-col md:flex-row items-center justify-between">
                            <div className="flex items-center mb-6 md:mb-0">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mr-6 shrink-0">
                                    <i className="fas fa-heartbeat animate-pulse"></i>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-1">Wellness Alert</h3>
                                    <p className="text-slate-600 max-w-xl">
                                        Your recent metrics indicate high stress levels combined with low sleep. After reviewing your recommendation above, we strongly advise connecting with a counselor for personalized support.
                                    </p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => navigate('/counselor-support')}
                                className="w-full md:w-auto px-8 py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 hover:shadow-red-500/30 transition-all flex items-center justify-center whitespace-nowrap"
                            >
                                <i className="fas fa-user-md mr-2"></i> Connect with Counselor
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>
      
      <Chatbot />
    </Layout>
  );
};

export default StudentSurvey;