import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  getCurrentUser, getStudentSurveys, sendHighRiskEmailAlert, 
  requestCounselorSupport, calculateRiskProfile, getStudentFeedback,
  getStudentTicketStatus, getStudentNotifications, saveInterventionResponse,
  getStudentAppointments, getStudentInterventionAssignments, updateInterventionAssignmentStatus,
  saveSuggestionFeedback, syncWithBackend
} from '../services/storageService';
import { generateStudentReport } from '../services/reportGenerator';
import { checkAndSendHighRiskAlert } from '../services/emailService';
import { StudentProfile, WellnessSurvey, Role, Recommendation, FacultyFeedback, SupportTicket, SystemNotification, InterventionResponse, Appointment, InterventionAssignment } from '../types';
import Chatbot from '../components/Chatbot';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const StudentDashboard: React.FC = () => {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [surveys, setSurveys] = useState<WellnessSurvey[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [streak, setStreak] = useState(0);
  const [riskLevel, setRiskLevel] = useState(0);
  const [suggestions, setSuggestions] = useState<{title: string, category: string, description: string, icon: string}[]>([]);
  const [facultyFeedback, setFacultyFeedback] = useState<FacultyFeedback | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('dismissed_notifs') || '[]'); } catch { return []; }
  });
  const [supportTicket, setSupportTicket] = useState<SupportTicket | null>(null);
  const [supportRequested, setSupportRequested] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [dailyQuote, setDailyQuote] = useState("");
  const [pendingApptFeedback, setPendingApptFeedback] = useState<Appointment | null>(null);
  const [assignments, setAssignments] = useState<InterventionAssignment[]>([]);

  // Intervention Modal State
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<InterventionAssignment | null>(null);
  const [interventionStatus, setInterventionStatus] = useState<'PENDING' | 'COMPLETED' | 'MISSED'>('PENDING');
  const [interventionForm, setInterventionForm] = useState({
      helpful: 'Yes',
      comments: '',
      stressAfter: 5,
      moodAfter: 'Neutral',
      issueResolved: 'No',
      sessionRating: 5,
      missedReason: ''
  });

  // Suggestion Feedback State
  const [suggestionFeedbackMode, setSuggestionFeedbackMode] = useState<{idx: number, type: 'COMPLETE' | 'MISSED'} | null>(null);
  const [suggestionComment, setSuggestionComment] = useState("");

  const QUOTES = [
      "You are capable of amazing things.",
      "Small steps every day lead to big changes.",
      "Your mental health is a priority.",
      "Breathe. You've got this.",
      "Focus on what you can control.",
      "It's okay to take a break.",
      "Progress, not perfection."
  ];

  // Prepare chart data
  const chartData = [...surveys].reverse().map(s => ({
    date: s.date.slice(0, 5),
    stress: s.stressLevel,
    sleep: s.sleepQuality
  }));

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.STUDENT) {
      setUser(currentUser);
      syncWithBackend().then(() => {
        const data = getStudentSurveys(currentUser.rollNumber);
        setSurveys(data);
        
        // Fetch Feedback & Notifications
        const fb = getStudentFeedback(currentUser.rollNumber);
        setFacultyFeedback(fb);
        const notifs = getStudentNotifications(currentUser.rollNumber);
        setNotifications(notifs);

        const ticket = getStudentTicketStatus(currentUser.rollNumber);
        setSupportTicket(ticket);
        if(ticket && ticket.status === 'PENDING') setSupportRequested(true);
        
        const appts = getStudentAppointments(currentUser.rollNumber);
        const pending = appts.find(a => a.status === 'COMPLETED' && !a.feedback);
        setPendingApptFeedback(pending || null);

        const studentAssignments = getStudentInterventionAssignments(currentUser.rollNumber);
        setAssignments(studentAssignments);

        if (data.length > 0) {
          const latest = data[0];
          generateRecommendation(latest.stressLevel, latest.sleepQuality);
          
          // Calculate Streak & Risk using shared logic or local
          const profile = calculateRiskProfile(currentUser.rollNumber);
          setStreak(profile.streak);
          
          // Determine displayed risk level (Faculty override > Data)
          if (fb && (fb.status === 'CRITICAL' || fb.status === 'HIGH_RISK')) {
               setRiskLevel(9); // Visualize as high
          } else {
               setRiskLevel(latest.stressLevel);
          }

          generateSuggestions(latest);
          checkCriticalCondition(currentUser, latest);
          
          // Check Dismissal
          const dismissedId = localStorage.getItem('wellnex_dismissed_risk_id');
          if (data.length > 0 && data[0].id === dismissedId) {
              setIsDismissed(true);
          }
        }
      });
      
      // Set Daily Quote
      setDailyQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }
  }, []);

  const checkCriticalCondition = (student: StudentProfile, survey: WellnessSurvey) => {
    // Check for critical condition using the new email service logic
    const isHighRisk = checkAndSendHighRiskAlert(student, survey);
    if (isHighRisk) {
      setIsCritical(true);
      // Also trigger system notification if needed, but email service handles the main alert
      sendHighRiskEmailAlert(student, survey); // Keep existing notification logic as backup/UI alert
    }
  };

  const generateRecommendation = (stress: number, sleep: number) => {
    let rec: Recommendation;
    if (stress <= 4) {
      rec = { 
          category: 'Holistic Maintenance', 
          message: "Your metrics indicate optimal resilience and manageable stress levels. Focus on sustaining this balance! Consistent sleep schedules, regular physical activity, and proactive mindfulness practices like daily journaling or meditation will help you build a strong foundation for when academic demands increase.", 
          isUrgent: false 
      };
    } else if (stress <= 7) {
      rec = { 
          category: 'Cognitive Load Management', 
          message: "Moderate stress detected. It's time to be proactive before it escalates. Prioritize your tasks using the Eisenhower Matrix to focus on what truly matters. Ensure you are taking micro-breaks (5-10 minutes) every hour of studying to prevent mental fatigue, and protect your sleep schedule fiercely.", 
          isUrgent: false 
      };
    } else {
      rec = { 
          category: 'Clinical Intervention Required', 
          message: "Critical stress markers identified. High stress over prolonged periods severely impacts cognitive function and physical health. We strongly advise speaking with a campus counselor. In the moment, prioritize deep breathing exercises and completely disconnect from academic work for the rest of the evening.", 
          isUrgent: true 
      };
    }
    setRecommendation(rec);
  };

  const handleRequestSupport = () => {
    if (user) {
        requestCounselorSupport(user.rollNumber, user.name);
        setSupportRequested(true);
        // Optimistically update
        setSupportTicket({
             id: 'temp', studentRollNumber: user.rollNumber, studentName: user.name, 
             requestDate: new Date().toLocaleDateString(), status: 'PENDING', timestamp: Date.now()
        });
    }
  };

  const handleDismissRisk = () => {
    setIsDismissed(true);
    if (surveys.length > 0) {
        localStorage.setItem('wellnex_dismissed_risk_id', surveys[0].id);
    }
  };

  const handleSuggestionResponse = async (success: boolean) => {
    if (!user || suggestionFeedbackMode === null) return;
    
    const sugg = suggestions[suggestionFeedbackMode.idx];
    const feedback = {
        studentRollNumber: user.rollNumber,
        studentName: user.name,
        strategy: `Suggestion: ${sugg.title}`,
        status: success ? 'COMPLETED' : 'MISSED',
        feedback: suggestionComment,
        category: sugg.category,
        timestamp: Date.now()
    };

    // AI suggestions are transient and do not map to formal Intervention IDs in the database.
    console.log("AI Suggestion Feedback:", feedback);
    
    // Clear state
    setSuggestionFeedbackMode(null);
    setSuggestionComment("");
    alert("Thank you for your feedback!");
  };

  const generateSuggestions = (s: WellnessSurvey) => {
    const suggs = [];
    if (s.stressLevel >= 7) {
        suggs.push({
            title: "Physiological Sigh (Breathwork)",
            category: "Stress Management",
            description: "A fast way to reduce autonomic arousal. Inhale deeply twice through the nose, then exhale very slowly through the mouth. Repeat 3-5 times to significantly lower your heart rate and cortisol levels.",
            icon: "fa-lungs"
        });
    }
    if (s.sleepQuality <= 5) {
        suggs.push({
            title: "Digital Sunset Protocol",
            category: "Sleep Hygiene",
            description: "Blue light disrupts melatonin production. Turn off all screens 90 minutes before bed. Use this critical time for reading a physical book, light stretching, or preparing for the next day.",
            icon: "fa-moon"
        });
    }
    if (s.academicPressure >= 7) {
        suggs.push({
            title: "Eisenhower Matrix Prioritization",
            category: "Productivity & Focus",
            description: "Overwhelm often comes from trying to do everything at once. Categorize your tasks by Urgency and Importance. Focus completely on the 'Important & Urgent' block and defer or drop the rest for today.",
            icon: "fa-tasks"
        });
    }
    if (s.mood === 'Sad' || s.mood === 'Anxious') {
        suggs.push({
            title: "Proactive Social Connection",
            category: "Mental Health Support",
            description: "Isolation compounds negative emotions. Reach out to a friend, family member, or mentor today. Even a 5-minute conversation or a quick walk together can significantly shift your perspective and boost neurotransmitters.",
            icon: "fa-user-friends"
        });
    }
    if (suggs.length === 0) {
        suggs.push({
            title: "Active Maintenance Mode",
            category: "General Wellness",
            description: "You are doing great! Continue your current routine. Now is the perfect time to build healthy habits like meal prepping, establishing a morning routine, and staying consistently hydrated.",
            icon: "fa-check-circle"
        });
    }
    setSuggestions(suggs);
  };

  const handleInterventionSubmit = async () => {
    if (!user || !selectedAssignment) return;

    try {
        const payload = {
            interventionId: selectedAssignment.id,
            status: interventionStatus,
            missedReason: interventionStatus === 'MISSED' ? interventionForm.missedReason : null,
            stressBefore: surveys[0]?.stressLevel || 5,
            stressAfter: interventionForm.stressAfter,
            feedback: interventionForm.comments,
            rating: interventionForm.sessionRating,
            helpful: interventionForm.helpful,
            issueResolved: interventionForm.issueResolved
        };

        await saveSuggestionFeedback(payload);
        
        // Update local state
        const updatedAssignments = assignments.map(a => 
            a.id === selectedAssignment.id ? { ...a, status: (interventionStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS') as any } : a
        );
        setAssignments(updatedAssignments);

        setShowInterventionModal(false);
        setSelectedAssignment(null);
        setInterventionStatus('PENDING');
        setInterventionForm({ 
            helpful: 'Yes', comments: '', stressAfter: 5, moodAfter: 'Neutral', 
            issueResolved: 'No', sessionRating: 5, missedReason: '' 
        });
        
        alert(interventionStatus === 'COMPLETED' ? 
            "Great job! Your feedback has been shared." : 
            "Recorded. Try to complete it when you can.");
            
        await syncWithBackend();
    } catch (err) {
        console.error("Failed to submit feedback", err);
        alert("Action failed. Server error.");
    }
  };

  const handleDownloadReport = () => {
     if (!user || surveys.length === 0) { alert("No data available to generate report."); return; }
     try {
         generateStudentReport(user, surveys, facultyFeedback, assignments);
     } catch(e) { console.error(e); }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <Layout userRole={Role.STUDENT} userName={user.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
            <p className="text-slate-500 mt-1 flex items-center">
                <i className="fas fa-quote-left text-indigo-400 mr-2 text-xs"></i>
                <span className="italic font-medium text-indigo-600">{dailyQuote}</span>
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
             <button onClick={() => setShowBreathingModal(true)} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-teal-200 transition-all flex items-center">
                <i className="fas fa-wind mr-2"></i> Breathe
             </button>
             <button onClick={() => window.location.hash = '#/student-survey'} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center">
                <i className="fas fa-plus-circle mr-2"></i> New Check-in
             </button>
             <button onClick={handleDownloadReport} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center">
                <i className="fas fa-download mr-2"></i> Report
             </button>
          </div>
        </div>

        {/* Pending Appointment Feedback Alert */}
        {pendingApptFeedback && (
            <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center animate-pulse">
                <div className="flex items-center mb-3 md:mb-0">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm">
                        <i className="fas fa-star text-yellow-300"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">Feedback Required</h4>
                        <p className="text-indigo-100 text-sm">How was your session with {pendingApptFeedback.counselorName}?</p>
                    </div>
                </div>
                <button 
                    onClick={() => window.location.hash = '#/counselor-support'}
                    className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap"
                >
                    Rate Session
                </button>
            </div>
        )}
  
        {/* Student Wellness Status Update Section */}
        {facultyFeedback && (
            <div className="animate-fade-in-down space-y-6">
                
                {/* STATUS: RESOLVED (Moved to History/Summary view) */}
                {/* Removed Issue Resolved Card as per request */}

                {/* STATUS: COUNSELING SCHEDULED */}
                {facultyFeedback.status === 'COUNSELING_SCHEDULED' && facultyFeedback.counselingDetails && (
                    <div className="bg-white border-l-4 border-blue-500 p-6 rounded-r-2xl shadow-md transform hover:scale-[1.01] transition-transform">
                        <div className="flex items-center mb-4">
                             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-4 shadow-sm">
                                <i className="fas fa-calendar-check text-xl"></i>
                             </div>
                             <div>
                                <h3 className="text-blue-900 font-bold text-xl">Counseling Session Confirmed</h3>
                                <p className="text-blue-600 text-sm">Please review the details below.</p>
                             </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-lg bg-white text-blue-500 flex items-center justify-center shadow-sm mr-3 mt-1">
                                        <i className="fas fa-clock"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">When</p>
                                        <p className="text-slate-800 font-semibold">{facultyFeedback.counselingDetails.date}</p>
                                        <p className="text-slate-600 text-sm">{facultyFeedback.counselingDetails.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-lg bg-white text-blue-500 flex items-center justify-center shadow-sm mr-3 mt-1">
                                        <i className="fas fa-user-md"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Counselor</p>
                                        <p className="text-slate-800 font-semibold">{facultyFeedback.counselingDetails.counselorName}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-lg bg-white text-blue-500 flex items-center justify-center shadow-sm mr-3 mt-1">
                                        <i className="fas fa-map-pin"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Location</p>
                                        <p className="text-slate-800 font-semibold">{facultyFeedback.counselingDetails.location}</p>
                                    </div>
                                </div>
                                <div className="bg-blue-100/50 p-3 rounded-lg text-sm text-blue-800 italic border border-blue-100">
                                    "{facultyFeedback.counselingDetails.message}"
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STATUS: ASSIGNED WELLNESS TASKS */}
                {/* STATUS: UNDER REVIEW / OBSERVATION (Hidden if Resolved or Scheduled or Ticket Resolved) */}
                {['UNDER_OBSERVATION', 'MODERATE', 'HIGH_RISK', 'CRITICAL'].includes(facultyFeedback.status) && (!supportTicket || supportTicket.status !== 'RESOLVED') && (
                    <div className="bg-white border border-indigo-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-900 group-hover:opacity-10 transition-opacity">
                            <i className="fas fa-clipboard-list text-8xl"></i>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3">
                                    <i className="fas fa-search"></i>
                                </div>
                                <h3 className="text-indigo-900 font-bold text-lg">Faculty Review in Progress</h3>
                            </div>
                            
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    <span className="font-bold text-indigo-700">Faculty Note:</span> {facultyFeedback.facultyNotes || "Your wellness profile is being reviewed by the student support team."}
                                </p>
                            </div>
                            
                            {facultyFeedback.recommendation && (
                                 <div className="flex items-center text-sm font-bold text-indigo-700 bg-white px-4 py-2 rounded-lg border border-indigo-50 shadow-sm w-fit">
                                    <i className="fas fa-lightbulb text-yellow-500 mr-2"></i> 
                                    Recommendation: {facultyFeedback.recommendation}
                                 </div>
                            )}
                            
                            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                                <span>Case ID: #{user.rollNumber.slice(-4)}</span>
                                <span>Last Updated: {new Date(facultyFeedback.lastUpdated).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Messages Received (Global Broadcasts) */}
        {notifications.filter(n => !dismissedNotifs.includes(n.id)).length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all animate-fade-in-down">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                    <i className="fas fa-bullhorn text-indigo-500 mr-2"></i> Messages Received (Global Broadcasts)
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {notifications.filter(n => !dismissedNotifs.includes(n.id)).map(n => (
                        <div key={n.id} className={`p-4 rounded-xl border-l-4 shadow-sm ${n.type === 'ALERT' ? 'bg-red-50 border-red-500' : n.type === 'REMINDER' ? 'bg-orange-50 border-orange-400' : 'bg-blue-50 border-blue-400'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-bold text-sm ${n.type === 'ALERT' ? 'text-red-800' : n.type === 'REMINDER' ? 'text-orange-800' : 'text-blue-800'}`}>
                                    {n.type === 'ALERT' ? 'Urgent Alert' : n.type === 'REMINDER' ? 'Reminder' : 'Information'}
                                </h4>
                                <span className="text-[10px] text-gray-500 font-medium">{n.date}</span>
                            </div>
                            <p className={`text-sm ${n.type === 'ALERT' ? 'text-red-700' : n.type === 'REMINDER' ? 'text-orange-700' : 'text-blue-700'}`}>
                                {n.message}
                            </p>
                            <div className="mt-2 text-right">
                                <button 
                                    onClick={() => {
                                        const updated = [...dismissedNotifs, n.id];
                                        setDismissedNotifs(updated);
                                        localStorage.setItem('dismissed_notifs', JSON.stringify(updated));
                                    }}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    Mark as Read
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Risk Level & Critical Alert */}
        {((riskLevel >= 8 || isCritical) && (!facultyFeedback || facultyFeedback.status !== 'RESOLVED') && (!supportTicket || supportTicket.status !== 'RESOLVED') && !isDismissed) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-md flex flex-col md:flex-row items-center justify-between animate-pulse relative">
                <button 
                    onClick={handleDismissRisk} 
                    className="absolute top-2 right-2 text-red-300 hover:text-red-500 transition-colors"
                    title="Dismiss Alert"
                >
                    <i className="fas fa-times"></i>
                </button>
                <div className="flex items-center mb-4 md:mb-0">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-600 mr-4 shadow-sm">
                        <i className="fas fa-exclamation-triangle text-xl"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900">Attention Needed</h3>
                        <p className="text-red-700 text-sm">Your metrics or faculty assessment indicate high stress levels.</p>
                    </div>
                </div>
                {supportTicket ? (
                     <div className={`px-6 py-3 rounded-xl font-bold text-white shadow-md ${supportTicket.status === 'RESOLVED' ? 'bg-green-500' : 'bg-blue-500'}`}>
                         {supportTicket.status === 'PENDING' ? 'Request Pending' : supportTicket.status === 'ACCEPTED' ? 'Support Scheduled' : 'Resolved'}
                     </div>
                ) : (
                    <button 
                        onClick={handleRequestSupport}
                        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all"
                    >
                        Connect with Counselor
                    </button>
                )}
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                         <i className="fas fa-fire"></i>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">STREAK</span>
                </div>
                <div className="mt-4">
                    <div className="text-3xl font-bold text-slate-800">{streak}</div>
                    <div className="text-xs text-slate-500 font-medium">Consecutive Days</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
                 <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                         <i className="fas fa-list-alt"></i>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="text-3xl font-bold text-slate-800">{surveys.length}</div>
                    <div className="text-xs text-slate-500 font-medium">Total Entries</div>
                </div>
            </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
                 <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                         <i className="fas fa-moon"></i>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="text-3xl font-bold text-slate-800">
                         {surveys.length > 0 ? (surveys.reduce((acc, curr) => acc + curr.sleepQuality, 0) / surveys.length).toFixed(1) : 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Avg Sleep Quality</div>
                </div>
            </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
                 <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                         <i className="fas fa-heart-broken"></i>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="text-3xl font-bold text-slate-800">
                         {surveys.length > 0 ? (surveys.reduce((acc, curr) => acc + curr.stressLevel, 0) / surveys.length).toFixed(1) : 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Avg Stress Level</div>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trends Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-slate-800 text-lg">Stress & Sleep Correlation</h3>
                </div>
                <div className="h-80">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorStressArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                                <YAxis yAxisId="left" orientation="left" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} tick={{fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="stress" stroke="#ef4444" fill="url(#colorStressArea)" strokeWidth={3} name="Stress" />
                                <Line yAxisId="left" type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} name="Sleep" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 italic">Submit survey data to visualize trends.</div>
                    )}
                </div>
            </div>

             {/* Personalized Tactics - Enhanced */}
             <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center text-lg">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3">
                        <i className="fas fa-lightbulb"></i>
                    </div>
                    Wellness Recommendations
                </h3>
                <div className="space-y-4 flex-1">
                    {suggestions.map((s, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all duration-300 group cursor-default">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <i className={`fas ${s.icon} text-xs`}></i>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">{s.title}</h4>
                                    <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">{s.category}</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">{s.description}</p>
                            
                            {/* Feedback Buttons */}
                            {suggestionFeedbackMode?.idx === idx ? (
                                <div className="mt-3 space-y-3 animate-fade-in-down">
                                    <textarea 
                                        className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
                                        placeholder={suggestionFeedbackMode.type === 'COMPLETE' ? "How did it help?" : "Why was it missed?"}
                                        value={suggestionComment}
                                        onChange={(e) => setSuggestionComment(e.target.value)}
                                    ></textarea>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSuggestionResponse(suggestionFeedbackMode.type === 'COMPLETE')} className="flex-1 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg">Submit</button>
                                        <button onClick={() => setSuggestionFeedbackMode(null)} className="flex-1 py-1.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setSuggestionFeedbackMode({idx, type: 'COMPLETE'})} className="flex-1 py-1 border border-green-200 text-green-600 text-[10px] font-bold rounded-lg hover:bg-green-50">Completed</button>
                                    <button onClick={() => setSuggestionFeedbackMode({idx, type: 'MISSED'})} className="flex-1 py-1 border border-red-200 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-50">Missed</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {suggestions.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <i className="fas fa-clipboard-list text-4xl mb-3 opacity-30"></i>
                            <p className="text-sm">Submit your first survey to receive personalized AI recommendations.</p>
                        </div>
                    )}
                </div>
                <button onClick={() => window.location.hash = '#/wellness-insights'} className="w-full mt-6 py-4 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 shadow-lg hover:shadow-slate-500/30 transition-all flex items-center justify-center group">
                    View Full Insights Report <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                </button>
            </div>
        </div>

      </div>
      
      {/* Breathing Exercise Modal */}
      {showBreathingModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="relative flex flex-col items-center justify-center text-center">
                <button onClick={() => setShowBreathingModal(false)} className="absolute -top-16 right-0 text-white/50 hover:text-white transition-colors">
                    <i className="fas fa-times text-2xl"></i>
                </button>
                
                <h2 className="text-3xl font-bold text-white mb-8">Box Breathing</h2>
                
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(45,212,191,0.5)] animate-breathe mb-8">
                    <span className="text-white font-bold text-xl animate-pulse">Breathe</span>
                </div>
                
                <p className="text-teal-100 text-lg max-w-md">
                    Inhale deeply... Hold... Exhale slowly...
                </p>
            </div>
            <style>{`
                @keyframes breathe {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.2); opacity: 1; }
                }
                .animate-breathe {
                    animation: breathe 8s infinite ease-in-out;
                }
            `}</style>
        </div>
      )}


      <Chatbot />
    </Layout>
  );
};

export default StudentDashboard;