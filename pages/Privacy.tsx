import React from 'react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans text-slate-800">
      <div className="max-w-4xl mx-auto p-8 md:p-12 w-full">
        <button onClick={() => navigate('/')} className="flex items-center text-indigo-600 font-bold mb-8 hover:underline">
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
        </button>
        
        <h1 className="text-4xl font-extrabold text-slate-800 mb-6">Privacy Policy</h1>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-6">
                <i className="fas fa-shield-alt text-2xl text-emerald-600 mr-4"></i>
                <p className="text-emerald-800 font-medium">Your data security is our top priority. All personal wellness data is encrypted and strictly confidential.</p>
            </div>

            <h2 className="text-2xl font-bold text-slate-700">Data Collection</h2>
            <p className="text-slate-600 leading-relaxed">
                WellNex collects minimal data required to provide wellness recommendations:
            </p>
            <ul className="list-disc pl-5 text-slate-600">
                <li>Student identification (Roll Number, Department)</li>
                <li>Self-reported wellness metrics (Stress, Sleep, Mood)</li>
                <li>Usage timestamps</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-700 mt-4">Data Access</h2>
            <p className="text-slate-600 leading-relaxed">
                Data is accessible only to:
            </p>
            <ul className="list-disc pl-5 text-slate-600">
                <li><strong>You (The Student):</strong> Full access to your own history and insights.</li>
                <li><strong>Authorized Faculty Counselors:</strong> Access to aggregated analytics and alerts for students flagged as "High Risk".</li>
            </ul>
            
            <p className="text-slate-500 text-sm mt-8 border-t pt-4">
                Last Updated: {new Date().toLocaleDateString()}
            </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;