import React from 'react';
import { useNavigate } from 'react-router-dom';

const Help: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans text-slate-800">
      <div className="max-w-4xl mx-auto p-8 md:p-12 w-full">
        <button onClick={() => navigate('/')} className="flex items-center text-indigo-600 font-bold mb-8 hover:underline">
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
        </button>
        
        <h1 className="text-4xl font-extrabold text-slate-800 mb-6">Help & Support</h1>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
            
            <section>
                <h2 className="text-2xl font-bold text-slate-700 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-bold text-slate-800 mb-2">How often should I fill out the survey?</h3>
                        <p className="text-slate-600">We recommend submitting a wellness check-in once daily, preferably at the same time, to generate accurate trends.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-bold text-slate-800 mb-2">Who sees my data?</h3>
                        <p className="text-slate-600">Your individual logs are private. Faculty members only receive alerts if your metrics indicate a critical risk level requiring support.</p>
                    </div>
                     <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-bold text-slate-800 mb-2">How do I reset my password?</h3>
                        <p className="text-slate-600">Currently, password resets are handled by the admin. Please contact your faculty coordinator.</p>
                    </div>
                </div>
            </section>

            <section className="pt-6 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-slate-700 mb-4">Contact Support</h2>
                <p className="text-slate-600 mb-4">Need further assistance or want to report a bug? Reach out to our technical team.</p>
                <div className="flex items-center space-x-4">
                    <a href="mailto:wellnex@gmail.com?subject=Support Request - WellNex Platform" className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                        <i className="fas fa-envelope mr-2"></i> Email Support
                    </a>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default Help;