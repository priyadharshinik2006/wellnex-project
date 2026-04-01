import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Role } from '../types';
import { getCurrentUser } from '../services/storageService';
import { fetchWithAuth } from '../services/storageService';

const StudentInterventions: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [actionType, setActionType] = useState<'COMPLETED' | 'MISSED'>('COMPLETED');
  const [feedback, setFeedback] = useState('');
  const [missedReason, setMissedReason] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.STUDENT) {
      setUser(currentUser);
      fetchInterventions();
    }
  }, []);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/student/interventions');
      setInterventions(data || []);
    } catch (err) {
      console.error("Failed to load interventions:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (intervention: any, type: 'COMPLETED' | 'MISSED') => {
    setSelectedIntervention(intervention);
    setActionType(type);
    setFeedback('');
    setMissedReason('');
    setIsModalOpen(true);
  };

  const handleActionSubmit = async () => {
    try {
      await fetchWithAuth('/student/intervention-response', {
        method: 'POST',
        body: JSON.stringify({
          interventionId: selectedIntervention.id,
          status: actionType,
          feedback: actionType === 'COMPLETED' ? feedback : undefined,
          missedReason: actionType === 'MISSED' ? missedReason : undefined
        })
      });
      setIsModalOpen(false);
      fetchInterventions(); // Refresh list to reflect updated status
    } catch (err) {
      console.error("Failed to submit response", err);
      alert("Error submitting response. Please try again.");
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <Layout userRole={Role.STUDENT} userName={user.name}>
      <div className="space-y-8 pb-12 font-sans text-slate-800">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Faculty Recommendations</h1>
            <p className="text-slate-500 text-sm mt-1">Review and action the strategies assigned to you.</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xl shadow-inner border border-indigo-100">
            <i className="fas fa-clipboard-list"></i>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {loading ? (
             <div className="col-span-full py-12 text-center text-gray-500 font-bold">Loading recommendations...</div>
          ) : interventions.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fas fa-check-double"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
              <p className="text-gray-500 mt-1">You have no pending strategies or recommendations from faculty.</p>
            </div>
          ) : (
            interventions.map((intervention) => (
              <div key={intervention.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      intervention.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      intervention.status === 'IN_PROGRESS' || intervention.status === 'MISSED' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                      {intervention.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">By {intervention.assignedBy}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{intervention.strategy}</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                    {intervention.description}
                  </p>
                </div>

                {intervention.status === 'NOT_STARTED' || intervention.status === 'IN_PROGRESS' ? (
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => openModal(intervention, 'COMPLETED')}
                      className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl text-sm shadow-sm hover:bg-indigo-700 transition-colors"
                    >
                      Completed
                    </button>
                    <button 
                      onClick={() => openModal(intervention, 'MISSED')}
                      className="flex-1 bg-white text-slate-600 border border-gray-200 font-bold py-2 rounded-xl text-sm shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      Missed
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto pt-4 border-t border-gray-50">
                     <span className="text-xs text-gray-400 font-bold"><i className="fas fa-lock mr-1"></i> Response Recorded</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  {actionType === 'COMPLETED' ? 'Strategy Completed' : 'Strategy Missed'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><i className="fas fa-times"></i></button>
              </div>

              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-slate-700 font-bold text-sm">{selectedIntervention?.strategy}</p>
              </div>

              {actionType === 'COMPLETED' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">How did this strategy help?</label>
                  <textarea 
                    value={feedback} 
                    onChange={e => setFeedback(e.target.value)} 
                    placeholder="Provide your feedback here..."
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-32 resize-none bg-gray-50/50"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Reason for missing</label>
                  <textarea 
                    value={missedReason} 
                    onChange={e => setMissedReason(e.target.value)} 
                    placeholder="E.g., Too busy with exams, didn't understand the strategy..."
                    className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 h-32 resize-none bg-red-50/30 text-amber-900"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button 
                  onClick={handleActionSubmit} 
                  disabled={actionType === 'COMPLETED' ? !feedback.trim() : !missedReason.trim()}
                  className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 ${actionType === 'COMPLETED' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default StudentInterventions;
