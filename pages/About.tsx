import React from 'react';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans text-slate-800">
      <div className="max-w-4xl mx-auto p-8 md:p-12 w-full">
        <button onClick={() => navigate('/')} className="flex items-center text-indigo-600 font-bold mb-8 hover:underline">
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
        </button>
        
        <h1 className="text-4xl font-extrabold text-slate-800 mb-6">About WellNex</h1>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <p className="text-lg font-medium text-slate-700 leading-relaxed">
                Wellnex – Intelligent Student Wellness & Risk Monitoring System is a full-stack, AI-powered mental health and well-being platform designed to proactively monitor, analyze, and support student wellness within educational institutions.
            </p>
            
            <p className="text-slate-600 leading-relaxed">
                The system provides a secure, role-based environment with separate portals for students and faculty/admins.
            </p>

            <h2 className="text-2xl font-bold text-slate-700 mt-6">Student Portal</h2>
            <p className="text-slate-600 leading-relaxed">
                The Student Portal features a smart dashboard that displays real-time wellness metrics such as stress levels, sleep patterns, mood trends, academic pressure indicators, check-in streaks, and case status updates including “Under Review,” “Counseling Scheduled,” and “Resolved.”
            </p>
            <p className="text-slate-600 leading-relaxed">
                Students can complete daily wellness check-ins through a quick survey module and receive immediate feedback along with AI-driven personalized recommendations such as breathing techniques, digital detox strategies, and stress management practices. Advanced analytics including radar charts, stress-versus-sleep trend visualizations, and a dynamic wellness score (0–100) help students track their overall well-being. The platform also enables counseling appointment booking, session management, crisis support access, and one-click generation of professional PDF wellness reports.
            </p>

            <h2 className="text-2xl font-bold text-slate-700 mt-6">Faculty/Admin Portal</h2>
            <p className="text-slate-600 leading-relaxed">
                The Faculty/Admin Portal provides intelligent student monitoring through automated risk profiling that categorizes students into Normal, Moderate, High Risk, or Critical levels based on behavioral patterns and wellness data trends. Faculty members can apply smart filters by department or risk level, track inactive students, and manage intervention workflows through a detailed student profile interface.
            </p>
            <p className="text-slate-600 leading-relaxed">
                The system includes tools to update risk status, assign recommendations, schedule counseling sessions, resolve support tickets, and maintain confidential notes. Department-level analytics offer comparative insights into stress and sleep levels across departments, risk distribution, and overall institutional wellness statistics.
            </p>

            <h2 className="text-2xl font-bold text-slate-700 mt-6">Core System Features</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>Role-based authentication</li>
                <li>Automated alerts and notifications</li>
                <li>Interactive data visualizations</li>
                <li>Integrated chatbot assistant</li>
                <li>Modern responsive user interface</li>
            </ul>
            
            <p className="mt-6 font-medium text-indigo-600 leading-relaxed">
                By combining AI-driven predictive scoring with structured intervention management, Wellnex acts as a proactive, scalable, and data-driven solution for enhancing student mental health support and early risk detection in academic institutions.
            </p>
        </div>
      </div>
    </div>
  );
};

export default About;