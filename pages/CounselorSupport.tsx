import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Role, Appointment } from '../types';
import { getCurrentUser, bookAppointment, getStudentAppointments, addAppointmentFeedback, fetchFacultyCounselors } from '../services/storageService';

const CounselorSupport: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const [counselors, setCounselors] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setAppointments(getStudentAppointments(currentUser.rollNumber));
    }
    
    // Fetch real counselors from backend
    fetchFacultyCounselors().then(data => {
        if (data && data.length > 0) {
            setCounselors(data);
        } else {
            // Fallback just in case the backend DB is empty during testing
            setCounselors([
                { id: 'c1', name: 'Dr. Sarah Johnson', department: 'Counseling' }
            ]);
        }
    });
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate || !selectedTime || !selectedCounselor) return;

    const counselor = counselors.find(c => c.id === selectedCounselor);
    
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      studentRollNumber: user.rollNumber,
      studentName: user.name,
      counselorId: selectedCounselor,
      counselorName: counselor?.name || 'Unknown',
      date: selectedDate,
      time: selectedTime,
      type: 'IN_PERSON',
      status: 'SCHEDULED',
      notes: notes
    };

    try {
      await bookAppointment(newAppointment);
      setAppointments([...appointments, newAppointment]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setSelectedCounselor('');
      setNotes('');
    } catch (err) {
      alert("Failed to book appointment. Please try again.");
    }
  };

  const openFeedback = (apptId: string) => {
      setSelectedAppointmentId(apptId);
      setFeedbackRating(5);
      setFeedbackComment('');
      setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
      if (selectedAppointmentId) {
          try {
              await addAppointmentFeedback(selectedAppointmentId, feedbackRating, feedbackComment);
              setShowFeedbackModal(false);
              if (user) {
                  const updated = getStudentAppointments(user.rollNumber);
                  setAppointments(updated);
              }
          } catch (err) {
              alert("Failed to submit feedback.");
          }
      }
  };

  return (
    <Layout userRole={Role.STUDENT} userName={user?.name || 'Student'}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Counselor Support Center</h1>
          <p className="text-indigo-100">Connect with our professional support team. Your conversations are confidential.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Booking Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <i className="fas fa-calendar-plus text-indigo-500 mr-3"></i> Book a Session
            </h2>
            
            <form onSubmit={handleBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Counselor</label>
                        <select 
                            value={selectedCounselor}
                            onChange={(e) => setSelectedCounselor(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                            required
                        >
                            <option value="">Select Counselor</option>
                            {counselors.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.department || c.specialization || 'Counseling'})</option>
                            ))}
                        </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Session Type</label>
                  <select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" disabled>
                    <option>In-Person Consultation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Date</label>
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Time</label>
                  <select 
                    required
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  >
                    <option value="">Select a slot...</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Visit (Optional)</label>
                <textarea 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Briefly describe what you'd like to discuss..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
              >
                Confirm Booking
              </button>
            </form>

            {showSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-center animate-fade-in-up">
                <i className="fas fa-check-circle text-xl mr-3"></i>
                <div>
                  <span className="font-bold">Success!</span> Your appointment has been scheduled.
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Upcoming & History */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Your Appointments</h3>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <i className="fas fa-calendar-times text-4xl mb-2 opacity-30"></i>
                  <p className="text-sm">No appointments scheduled yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map(app => (
                    <div key={app.id} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100 rounded-bl-full -mr-8 -mt-8"></div>
                      <div className="relative z-10">
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${app.status === 'MISSED' ? 'text-red-500' : 'text-indigo-500'}`}>{app.status}</div>
                        <h4 className="font-bold text-slate-800">{app.counselorName}</h4>
                        <div className="flex items-center text-sm text-slate-600 mt-2">
                          <i className="fas fa-clock mr-2 text-indigo-400"></i>
                          {app.date} at {app.time}
                        </div>
                        <div className="flex items-center text-sm text-slate-600 mt-1">
                          <i className="fas fa-map-marker-alt mr-2 text-indigo-400"></i>
                          Room 302, Wellness Center
                        </div>

                        {app.status === 'MISSED' && (
                            <div className="mt-3 text-xs text-red-600 font-bold flex items-center bg-red-50 p-2 rounded-lg border border-red-100">
                                <i className="fas fa-exclamation-circle mr-2"></i> You missed this slot
                            </div>
                        )}
                        {app.status === 'COMPLETED' && !app.feedback && (
                            <button 
                                onClick={() => openFeedback(app.id)}
                                className="mt-3 w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Give Feedback
                            </button>
                        )}
                        {app.feedback && (
                            <div className="mt-3 text-xs text-green-600 font-bold flex items-center bg-green-50 p-2 rounded-lg border border-green-100">
                                <i className="fas fa-check-circle mr-2"></i> Feedback Submitted
                            </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Need Immediate Help?</h3>
              <p className="text-sm opacity-90 mb-4">Our crisis helpline is available 24/7 for urgent support.</p>
              <button className="w-full py-3 bg-white text-orange-500 font-bold rounded-xl shadow-sm hover:bg-orange-50 transition-colors">
                <i className="fas fa-phone-alt mr-2"></i> Call Helpline
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-fade-in-up">
                <h3 className="text-2xl font-bold text-slate-800 mb-2 text-center">Rate Your Session</h3>
                <p className="text-slate-500 text-center mb-6 text-sm">How was your experience with the counselor?</p>
                
                <div className="flex justify-center space-x-4 mb-6">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            key={star} 
                            onClick={() => setFeedbackRating(star)}
                            className={`text-4xl transition-all transform hover:scale-110 ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-200'}`}
                        >
                            <i className="fas fa-star"></i>
                        </button>
                    ))}
                </div>
                
                <textarea 
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none mb-6 bg-gray-50"
                    placeholder="Share your thoughts (optional)..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                ></textarea>
                
                <div className="flex space-x-4">
                    <button onClick={() => setShowFeedbackModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                    <button onClick={submitFeedback} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all">Submit Feedback</button>
                </div>
            </div>
        </div>
      )}
    </Layout>
  );
};

export default CounselorSupport;
