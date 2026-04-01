import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Role } from '../types';
import { getCurrentUser } from '../services/storageService';

const AIJournal: React.FC = () => {
  const user = getCurrentUser();
  const [entry, setEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<null | { sentiment: string, reflection: string, tip: string }>(null);
  
  // Simulated AI Sentiment Analysis and Affirmation Generation
  const analyzeJournal = () => {
      if(!entry.trim()) return;
      
      setIsAnalyzing(true);
      setFeedback(null);
      
      // Simulate network request/processing delay
      setTimeout(() => {
          const text = entry.toLowerCase();
          let result = {
              sentiment: 'Neutral',
              reflection: "Thank you for sharing your thoughts today.",
              tip: "Consistency is key. Try to write a little bit every day to track your progress and clear your mind."
          };
          
          if (text.includes('stressed') || text.includes('anxious') || text.includes('overwhelmed') || text.includes('hard') || text.includes('tired')) {
              result = {
                  sentiment: 'High Cognitive Load',
                  reflection: "I hear that you're going through a tough time right now. It's completely valid to feel overwhelmed when balancing academic and personal responsibilities.",
                  tip: "Consider breaking your largest tasks into 5-minute micro-tasks. Right now, take 3 deep breaths before returning to your work."
              };
          } else if (text.includes('happy') || text.includes('great') || text.includes('good') || text.includes('excited') || text.includes('proud')) {
              result = {
                  sentiment: 'Positive Resonance',
                  reflection: "It sounds like you had a wonderful day! Recognizing these moments is crucial for building long-term psychological resilience.",
                  tip: "Take a second to actively express gratitude for whatever made today great. Carry this momentum forward!"
              };
          }

          setFeedback(result);
          setIsAnalyzing(false);
      }, 1500);
  };

  return (
    <Layout userRole={Role.STUDENT} userName={user?.name || 'Student'}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-20 transform rotate-12">
                <i className="fas fa-book-open text-9xl"></i>
            </div>
            <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">AI Wellness Journal</h1>
                <p className="text-teal-50 max-w-xl">Self-reflection reduces cortisol. Write down your unfiltered thoughts, and let our AI provide you with a personalized cognitive reflection and actionable affirmation.</p>
            </div>
        </div>

        {/* Workspace */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <i className="fas fa-pen-nib text-teal-500 mr-3"></i> Today's Entry
            </h2>
            
            <textarea 
                className="w-full h-64 p-6 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none transition-all text-slate-700 text-lg leading-relaxed placeholder-slate-400"
                placeholder="How are you feeling today? What's on your mind?..."
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
            ></textarea>
            
            <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-slate-400 font-medium">
                    {entry.length} characters written.
                </span>
                
                <button 
                    onClick={analyzeJournal}
                    disabled={isAnalyzing || entry.length < 10}
                    className="flex justify-center items-center py-3 px-8 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 hover:bg-teal-700 hover:shadow-teal-500/50 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isAnalyzing ? (
                       <><i className="fas fa-circle-notch fa-spin mr-2"></i> Analyzing...</>
                    ) : (
                       <><i className="fas fa-magic mr-2"></i> Generate Reflection</>
                    )}
                </button>
            </div>
        </div>

        {/* AI Feedback Section */}
        {feedback && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 p-8 shadow-inner animate-fade-in-up">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <i className="fas fa-robot"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">AI Cognitive Insight</h3>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <div className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-1">Detected Sentiment</div>
                        <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 font-semibold rounded-full border border-indigo-200">
                            {feedback.sentiment}
                        </div>
                    </div>
                    
                    <div className="pl-4 border-l-4 border-indigo-300">
                        <div className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2">Reflection</div>
                        <p className="text-slate-700 text-lg italic">{feedback.reflection}</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                        <div className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center">
                            <i className="fas fa-lightbulb text-yellow-500 mr-2 text-lg"></i> Actionable Tip
                        </div>
                        <p className="text-slate-800 font-medium">{feedback.tip}</p>
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default AIJournal;
