import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Chatbot from '../components/Chatbot';
import { 
  getCurrentUser, calculateRiskProfile, getSystemLogs, getStudents, getSupportTickets, updateSupportTicket,
  sendSystemNotification, getAppointments, getInterventionResponses, getAllInterventionAssignments,
  saveFacultyFeedback, saveInterventionAssignment, updateAppointmentStatus, syncWithBackend,
  getSurveys, getStudentNotifications
} from '../services/storageService';
import { generateSystemReport, generateStudentReport } from '../services/reportGenerator';
import { getSentEmails, EmailLog } from '../services/emailService';
import { StudentProfile, FacultyProfile, Role, RiskStatus, SupportTicket, FacultyFeedback, Appointment, InterventionResponse, InterventionAssignment, SystemNotification } from '../types';
import { DEPARTMENTS } from '../constants';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [interventions, setInterventions] = useState<InterventionResponse[]>([]);
  const [interventionAssignments, setInterventionAssignments] = useState<InterventionAssignment[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_notifs') || '[]'); } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'support' | 'analytics' | 'reports' | 'appointments' | 'interventions' | 'emails'>('students');
  
  // Filters
  const [filterDept, setFilterDept] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Student Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [facultyNote, setFacultyNote] = useState('');
  const [facultyRec, setFacultyRec] = useState('');
  const [facultyStatus, setFacultyStatus] = useState<RiskStatus>(RiskStatus.NORMAL);
  
  // Counseling Details State
  const [counselingDate, setCounselingDate] = useState('');
  const [counselingTime, setCounselingTime] = useState('');
  const [counselorName, setCounselorName] = useState('');
  const [counselingLocation, setCounselingLocation] = useState('');
  const [counselingMsg, setCounselingMsg] = useState('');

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.ADMIN) {
      setUser(currentUser);
      syncWithBackend().then(() => refreshData());
    }
  }, []);

  // Sync Tab with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view && ['overview', 'students', 'faculty', 'support', 'analytics', 'reports', 'appointments', 'interventions', 'emails'].includes(view)) {
      setActiveTab(view as any);
    } else {
       setActiveTab('students');
    }
  }, [location]);

  const refreshData = () => {
    const allStudents = getStudents();
    setStudents(allStudents);
    setTickets(getSupportTickets());
    setAppointments(getAppointments());
    setInterventions(getInterventionResponses());
    setInterventionAssignments(getAllInterventionAssignments());
    setSentEmails(getSentEmails());
    
    // Fetch notifications for the faculty (using email since that's what we stored it under)
    const currentUser = getCurrentUser();
    if (currentUser) {
        setNotifications(getStudentNotifications(currentUser.email));
    }

    // Calculate Risk Profiles for all students using synced surveys
    const enrichedData = allStudents.map(s => {
      const profile = calculateRiskProfile(s.rollNumber);
      // Attach survey history for the student detail modal
      const surveys = getSurveys().filter((sv: any) => sv.studentRollNumber === s.rollNumber);
      return { ...s, ...profile, surveys };
    });
    setRiskData(enrichedData);
  };



  
  // --- Department Visibility Helper ---
  const isCounselor = user?.department === 'General' || user?.department === 'Counseling';
  const visibleRiskData = riskData.filter(s => isCounselor || s.department === user?.department);
  const visibleStudents = students.filter(s => isCounselor || s.department === user?.department);
  const visibleTickets = tickets.filter(t => isCounselor || visibleStudents.some(s => s.rollNumber === t.studentRollNumber));
  const visibleAppointments = appointments.filter(a => isCounselor || visibleStudents.some(s => s.rollNumber === a.studentRollNumber));
  const visibleAssignments = interventionAssignments.filter(a => isCounselor || visibleStudents.some(s => s.rollNumber === a.studentRollNumber));

  // --- Statistics Calculation ---
  const stats = {
    total: visibleStudents.length,
    highRisk: visibleRiskData.filter(d => d.status === RiskStatus.HIGH_RISK || d.status === RiskStatus.CRITICAL).length,
    moderate: visibleRiskData.filter(d => d.status === RiskStatus.MODERATE).length,
    activeTickets: visibleTickets.filter(t => t.status === 'PENDING').length,
    missingCheckins: visibleRiskData.filter(d => {
       if (!d.lastSurvey) return true;
       const diff = Date.now() - d.lastSurvey.timestamp;
       return diff > 3 * 24 * 60 * 60 * 1000; // 3 days
    }).length,
  };

  const pieData = [
    { name: 'Normal', value: stats.total - stats.highRisk - stats.moderate },
    { name: 'Moderate', value: stats.moderate },
    { name: 'High Risk', value: stats.highRisk }
  ];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // --- Actions ---
  const handleStudentClick = (studentData: any) => {
    setSelectedStudent(studentData);
    setFacultyNote('');
    setFacultyRec('');
    setFacultyStatus(studentData.status);
    // Reset counseling fields
    setCounselingDate('');
    setCounselingTime('');
    setCounselorName('');
    setCounselingLocation('');
    setCounselingMsg('');
  };

  const submitFacultyIntervention = async () => {
    if (!selectedStudent) return;
    
    const feedback: FacultyFeedback = {
        studentRollNumber: selectedStudent.rollNumber,
        status: facultyStatus,
        recommendation: facultyRec,
        strategy: facultyRec,
        facultyNotes: facultyNote,
        lastUpdated: Date.now(),
        assignedBy: user.name
    };

    // Add Counseling Details if status is COUNSELING_SCHEDULED
    if (facultyStatus === RiskStatus.COUNSELING_SCHEDULED) {
        feedback.counselingDetails = {
            date: counselingDate,
            time: counselingTime,
            counselorName: counselorName,
            location: counselingLocation,
            message: counselingMsg
        };
    }

    // Add Resolution Date if status is RESOLVED
    if (facultyStatus === RiskStatus.RESOLVED) {
        feedback.resolutionDate = new Date().toLocaleDateString();
    }

    await saveFacultyFeedback(feedback);

    // Create a formal Intervention Assignment
    if (facultyRec) {
        const assignment: InterventionAssignment = {
            id: crypto.randomUUID(),
            studentRollNumber: selectedStudent.rollNumber,
            facultyId: user.id,
            facultyName: user.name,
            strategy: facultyRec,
            description: facultyNote,
            assignedDate: new Date().toLocaleDateString(),
            status: 'PENDING',
            notes: facultyStatus === RiskStatus.COUNSELING_SCHEDULED ? `Counseling on ${counselingDate} at ${counselingTime}` : undefined
        };
        await saveInterventionAssignment(selectedStudent.id, assignment);
    }
    
    if (facultyStatus === RiskStatus.CRITICAL || facultyStatus === RiskStatus.UNDER_OBSERVATION) {
        await sendSystemNotification(selectedStudent.rollNumber, `Faculty Update: Status changed to ${facultyStatus.replace('_', ' ')}. Check feedback.`, "ALERT");
    } else if (facultyStatus === RiskStatus.COUNSELING_SCHEDULED) {
        await sendSystemNotification(selectedStudent.rollNumber, `Counseling Session Scheduled. Please check your dashboard for details.`, "ALERT");
    } else if (facultyStatus === RiskStatus.RESOLVED) {
        await sendSystemNotification(selectedStudent.rollNumber, `Your wellness case has been marked as Resolved. Great job!`, "INFO");
    } else {
         await sendSystemNotification(selectedStudent.rollNumber, `New wellness recommendation received from ${user.name}.`, "INFO");
    }

    await syncWithBackend();
    refreshData();
    setShowSuccessToast(true);
    setTimeout(() => {
        setShowSuccessToast(false);
        setSelectedStudent(null);
    }, 1500);
  };

  const handleTicketAction = async (id: string, action: 'ACCEPTED' | 'RESOLVED') => {
    await updateSupportTicket(id, action);
    const ticket = tickets.find(t => t.id === id);
    if (ticket) await sendSystemNotification(ticket.studentRollNumber, `Your support request has been marked as ${action}.`, "INFO");
    await syncWithBackend();
    refreshData();
  };

  const handleAppointmentAction = async (id: string, status: 'COMPLETED' | 'MISSED') => {
    await updateAppointmentStatus(id, status);
    const appt = appointments.find(a => a.id === id);
    if (appt) {
        sendSystemNotification(appt.studentRollNumber, `Your appointment on ${appt.date} has been marked as ${status.replace('_', ' ')}.`, "INFO");
    }
    
    // Refresh data correctly by syncing
    await syncWithBackend();
    refreshData();
  };

  const sendReminder = (rollNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sendSystemNotification(rollNumber, "We haven't heard from you in a while! Please log your wellness survey.", "REMINDER");
    alert("Reminder sent successfully!");
  };

  const handleDownloadReport = () => {
    const deptData = DEPARTMENTS.map(dept => {
        const deptStudents = visibleRiskData.filter(s => s.department === dept);
        const avgStress = deptStudents.length > 0 
            ? (deptStudents.reduce((acc, curr) => acc + (curr.lastSurvey?.stressLevel || 0), 0) / deptStudents.length)
            : 0;
        const avgSleep = deptStudents.length > 0
            ? (deptStudents.reduce((acc, curr) => acc + (curr.lastSurvey?.sleepQuality || 0), 0) / deptStudents.length)
            : 0;
        return { name: dept, stress: avgStress, sleep: avgSleep };
    });

    const highRiskStudents = visibleRiskData.filter(s => s.status === RiskStatus.HIGH_RISK || s.status === RiskStatus.CRITICAL);
    
    generateSystemReport(stats, deptData, highRiskStudents);
  };

  const downloadReport = () => {
      if (!selectedStudent) return;
      const studentAssignments = visibleAssignments.filter(a => a.studentRollNumber === selectedStudent.rollNumber);
      const mockFeedback: FacultyFeedback = {
          studentRollNumber: selectedStudent.rollNumber,
          status: selectedStudent.status,
          recommendation: '',
          facultyNotes: '',
          lastUpdated: Date.now(),
          assignedBy: 'System'
      };
      generateStudentReport(selectedStudent, selectedStudent.surveys || [], mockFeedback, studentAssignments);
  };

  // Filtered Students Logic
  const filteredStudents = visibleRiskData.filter(s => {
    // 1. Department Visibility Logic
    // Dashboard Filter Logic
    const matchesFilterDept = filterDept === 'All' || s.department === filterDept;
    const matchesRisk = filterRisk === 'All' || s.status === filterRisk;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.rollNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    return matchesFilterDept && matchesRisk && matchesSearch;
  });

  if (!user) return <div className="p-10 flex justify-center"><i className="fas fa-circle-notch fa-spin text-indigo-600 text-3xl"></i></div>;

  return (
    <Layout userRole={Role.ADMIN} userName={user.name}>
      <div className="space-y-6 pb-12 font-sans text-slate-800">
        
        {/* Top Header - Contextual */}
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-indigo-50">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                    {activeTab === 'students' && 'Student Directory'}
                    {activeTab === 'overview' && 'System Overview'}
                    {activeTab === 'support' && 'Support Requests'}
                    {activeTab === 'analytics' && 'Department Analytics'}
                    {activeTab === 'reports' && 'Reports Center'}
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Manage student wellness and interventions</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                    <div className="text-xs text-slate-400 font-bold uppercase">Date</div>
                    <div className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString()}</div>
                </div>
            </div>
        </div>

        {/* --- STUDENTS TAB (DEFAULT) --- */}
        {activeTab === 'students' && (
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px] animate-fade-in-up">
                 {/* Filters */}
                 <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="relative">
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400"></i>
                            <input 
                                type="text" 
                                placeholder="Search Name or Roll No..." 
                                className="pl-10 pr-4 py-2 rounded-xl border border-indigo-100 bg-indigo-50/50 text-slate-700 placeholder-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none w-full md:w-64 text-sm transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select 
                            className="px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white cursor-pointer w-full md:w-48"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                        >
                            <option value="All">All Departments</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select 
                            className="px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white cursor-pointer"
                            value={filterRisk}
                            onChange={(e) => setFilterRisk(e.target.value)}
                        >
                            <option value="All">All Risk Levels</option>
                            <option value={RiskStatus.NORMAL}>Normal</option>
                            <option value={RiskStatus.MODERATE}>Moderate</option>
                            <option value={RiskStatus.HIGH_RISK}>High Risk</option>
                            <option value={RiskStatus.CRITICAL}>Critical</option>
                        </select>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase">
                        Showing {filteredStudents.length} Students
                    </div>
                 </div>

                 {/* Table */}
                 <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="p-4 border-b border-gray-100">Student Info</th>
                                <th className="p-4 border-b border-gray-100">Department</th>
                                <th className="p-4 border-b border-gray-100 text-center">Last Active</th>
                                <th className="p-4 border-b border-gray-100 text-center">Stress</th>
                                <th className="p-4 border-b border-gray-100 text-center">Sleep</th>
                                <th className="p-4 border-b border-gray-100 text-center">Risk Status</th>
                                <th className="p-4 border-b border-gray-100 text-center">Streak</th>
                                <th className="p-4 border-b border-gray-100 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-400">No students found matching filters.</td></tr>
                            ) : filteredStudents.map(s => {
                                const lastActiveDate = s.lastSurvey ? new Date(s.lastSurvey.timestamp) : null;
                                const isInactive = !lastActiveDate || (Date.now() - lastActiveDate.getTime() > 3 * 24 * 60 * 60 * 1000);
                                
                                return (
                                <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3 text-xs">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700">{s.name}</div>
                                                <div className="text-xs text-slate-400">{s.rollNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <div className="truncate w-32" title={s.department}>{s.department}</div>
                                        <div className="text-xs text-slate-400">{s.year}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {s.lastSurvey ? (
                                            <div>
                                                <div className="font-medium text-slate-700">{s.lastSurvey.date}</div>
                                                <div className="text-xs text-slate-400">{s.lastSurvey.time}</div>
                                            </div>
                                        ) : <span className="text-xs text-gray-300">Never</span>}
                                    </td>
                                    <td className="p-4 text-center font-bold">
                                        {s.lastSurvey ? (
                                            <span className={`${s.lastSurvey.stressLevel >= 8 ? 'text-red-500' : s.lastSurvey.stressLevel >= 6 ? 'text-orange-500' : 'text-green-500'}`}>
                                                {s.lastSurvey.stressLevel}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-center font-bold">
                                        {s.lastSurvey ? (
                                            <span className={`${s.lastSurvey.sleepQuality <= 4 ? 'text-red-500' : 'text-blue-500'}`}>
                                                {s.lastSurvey.sleepQuality}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                            ${s.status === RiskStatus.HIGH_RISK || s.status === RiskStatus.CRITICAL ? 'bg-red-100 text-red-700' : 
                                              s.status === RiskStatus.MODERATE ? 'bg-yellow-100 text-yellow-700' : 
                                              s.status === RiskStatus.UNDER_OBSERVATION ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                            {s.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {s.streak > 0 ? (
                                            <span className="flex items-center justify-center text-orange-500 font-bold">
                                                <i className="fas fa-fire mr-1 text-xs"></i> {s.streak}
                                            </span>
                                        ) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button 
                                                onClick={() => handleStudentClick(s)}
                                                className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center"
                                                title="View Details"
                                            >
                                                <i className="fas fa-eye text-xs"></i>
                                            </button>
                                            {isInactive && (
                                                <button 
                                                    onClick={(e) => sendReminder(s.rollNumber, e)}
                                                    className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors flex items-center justify-center"
                                                    title="Send Reminder"
                                                >
                                                    <i className="fas fa-bell text-xs"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 </div>
             </div>
        )}

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in-up">
                {/* Stats Grid - Enhanced */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Total Students</p>
                                <h3 className="text-3xl font-extrabold">{stats.total}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                                <i className="fas fa-users"></i>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-purple-100 font-medium bg-white/10 px-2 py-1 rounded inline-block">
                            Active Enrollment
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-orange-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="text-red-100 text-xs font-bold uppercase tracking-wider mb-1">Critical Attention</p>
                                <h3 className="text-3xl font-extrabold">{stats.highRisk}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-red-100 font-medium bg-white/10 px-2 py-1 rounded inline-block">
                            Requires Immediate Action
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Pending Requests</p>
                                <h3 className="text-3xl font-extrabold">{stats.activeTickets}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                                <i className="fas fa-ticket-alt"></i>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-blue-100 font-medium bg-white/10 px-2 py-1 rounded inline-block">
                            Support Tickets Open
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Appointments Today</p>
                                <h3 className="text-3xl font-extrabold">{visibleAppointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-emerald-100 font-medium bg-white/10 px-2 py-1 rounded inline-block">
                            Scheduled Sessions
                        </div>
                    </div>
                </div>

                {/* Messages Received (Global Broadcasts) */}
                {notifications.filter(n => !dismissedNotifs.includes(n.id)).length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all animate-fade-in-down mb-8">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <i className="fas fa-bullhorn text-indigo-500 mr-2"></i> Messages Received (Global Broadcasts)
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Risk Distribution Chart */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                            <i className="fas fa-chart-pie text-indigo-500 mr-2"></i> Risk Distribution
                        </h3>
                        <div className="flex-1 min-h-[250px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={pieData} 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Action Center: Combined High Risk & Pending Tickets */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <i className="fas fa-bolt text-yellow-500 mr-2"></i> Action Center
                            </h3>
                            <span className="text-xs font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">Priority Items</span>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto pr-2 flex-1 max-h-[300px]">
                             {/* Pending Tickets Section */}
                             {visibleTickets.filter(t => t.status === 'PENDING').length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3 ml-1">New Support Requests</h4>
                                    <div className="space-y-3">
                                        {visibleTickets.filter(t => t.status === 'PENDING').slice(0, 3).map(ticket => (
                                            <div key={ticket.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:shadow-md transition-all">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-xl bg-white text-blue-600 font-bold flex items-center justify-center shadow-sm mr-4">
                                                        <i className="fas fa-ticket-alt"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{ticket.studentName}</h4>
                                                        <p className="text-xs text-blue-600 font-medium">Request Date: {ticket.requestDate}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleTicketAction(ticket.id, 'ACCEPTED')} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">Accept</button>
                                                    <button onClick={() => handleTicketAction(ticket.id, 'RESOLVED')} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 shadow-sm transition-colors">Resolve</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}

                             {/* High Risk Students Section */}
                             <div>
                                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 ml-1">Critical Risk Alerts</h4>
                                <div className="space-y-3">
                                    {visibleRiskData.filter(d => d.status === RiskStatus.HIGH_RISK || d.status === RiskStatus.CRITICAL).length === 0 ? (
                                        <div className="p-6 text-center bg-green-50 rounded-2xl border border-green-100 text-green-600 text-sm font-medium">
                                            <i className="fas fa-check-circle mr-2"></i> No critical risk alerts at this time.
                                        </div>
                                    ) : (
                                        visibleRiskData.filter(d => d.status === RiskStatus.HIGH_RISK || d.status === RiskStatus.CRITICAL).slice(0, 5).map(student => (
                                            <div key={student.id} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100 hover:shadow-md transition-all">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-xl bg-white text-red-500 font-bold flex items-center justify-center shadow-sm mr-4">{student.name.charAt(0)}</div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{student.name}</h4>
                                                        <p className="text-xs text-red-600 font-medium">Stress: {student.lastSurvey?.stressLevel}/10 • {student.department}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleStudentClick(student)} className="px-4 py-2 bg-white text-red-600 text-xs font-bold rounded-lg shadow-sm hover:bg-red-600 hover:text-white transition-colors border border-red-100">View Profile</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- APPOINTMENTS TAB --- */}
        {activeTab === 'appointments' && (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-fade-in-up">
                 <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <i className="fas fa-calendar-check text-indigo-500 mr-2"></i> Scheduled Appointments
                 </h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4 rounded-l-xl">Date & Time</th>
                                <th className="p-4">Student</th>
                                <th className="p-4">Counselor</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 rounded-r-xl">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {visibleAppointments.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No appointments scheduled.</td></tr>
                            ) : visibleAppointments.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="font-bold">{a.date}</div>
                                        <div className="text-xs">{a.time}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{a.studentName}</div>
                                        <div className="text-xs text-gray-400">{a.studentRollNumber}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{a.counselorName}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            a.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-600' : 
                                            a.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                                            a.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {a.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {a.status === 'SCHEDULED' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAppointmentAction(a.id, 'COMPLETED')} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700">Complete</button>
                                                <button onClick={() => handleAppointmentAction(a.id, 'MISSED')} className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded hover:bg-gray-600">Missed</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             </div>
        )}

        {/* --- INTERVENTIONS TAB --- */}
        {activeTab === 'interventions' && (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-fade-in-up">
                 <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <i className="fas fa-clipboard-check text-indigo-500 mr-2"></i> Student Intervention Assignments & Responses
                 </h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4 rounded-l-xl">Assigned Date</th>
                                <th className="p-4">Student</th>
                                <th className="p-4">Strategy</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Feedback / Notes</th>
                                <th className="p-4 rounded-r-xl">Assigned By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {visibleAssignments.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No interventions assigned yet.</td></tr>
                            ) : visibleAssignments.map(assignment => {
                                const response = interventions.find(r => r.interventionId === assignment.id || r.assignmentId === assignment.id);
                                return (
                                <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-600">
                                        {assignment.assignedDate}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{students.find(s => s.rollNumber === assignment.studentRollNumber)?.name || assignment.studentRollNumber}</div>
                                        <div className="text-xs text-gray-400">{assignment.studentRollNumber}</div>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-indigo-600">
                                        {assignment.strategy}
                                        {assignment.notes && <div className="text-xs text-gray-400 mt-1">{assignment.notes}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            assignment.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                                            assignment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                                        }`}>
                                            {assignment.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 max-w-xs">
                                        {response ? (
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-slate-500">Student Feedback:</div>
                                                {response.missedReason && (
                                                    <div className="text-xs">
                                                        <span className="font-medium">Reason for Missing:</span> {response.missedReason}
                                                    </div>
                                                )}
                                                {response.feedback && (
                                                    <div className="text-xs">
                                                        <span className="font-medium">Feedback:</span> {response.feedback}
                                                    </div>
                                                )}
                                                {response.rating && (
                                                    <div className="text-xs">
                                                        <span className="font-medium">Rating:</span> {response.rating}/5
                                                    </div>
                                                )}
                                                {response.helpful && (
                                                    <div className="text-xs">
                                                        <span className="font-medium">Helpful:</span> {response.helpful}
                                                    </div>
                                                )}
                                                {response.issueResolved && (
                                                    <div className="text-xs">
                                                        <span className="font-medium">Issue Resolved:</span> {response.issueResolved}
                                                    </div>
                                                )}
                                                {response.stressBefore && (
                                                    <div className="text-xs mt-1">
                                                        <span className="font-medium">Stress Change:</span> {response.stressBefore} → {response.stressAfter}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Pending student response...</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {assignment.facultyName}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 </div>
             </div>
        )}

        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-6 text-lg">Department Wellness Overview</h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={(isCounselor ? DEPARTMENTS : [user?.department || '']).map(dept => {
                                    const deptStudents = visibleRiskData.filter(s => s.department === dept);
                                    const avgStress = deptStudents.length > 0 
                                        ? parseFloat((deptStudents.reduce((acc, curr) => acc + (curr.lastSurvey?.stressLevel || 0), 0) / deptStudents.length).toFixed(1))
                                        : 0;
                                    const avgSleep = deptStudents.length > 0 
                                        ? parseFloat((deptStudents.reduce((acc, curr) => acc + (curr.lastSurvey?.sleepQuality || 0), 0) / deptStudents.length).toFixed(1))
                                        : 0;
                                    return { name: dept, Stress: avgStress, Sleep: avgSleep };
                                }).filter(d => d.Stress > 0 || d.Sleep > 0)}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                                />
                                <Legend />
                                <Bar dataKey="Stress" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="Sleep" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-slate-800 mb-6 text-lg">High Risk Students by Department</h3>
                        <div className="h-80">
                            {visibleRiskData.filter(s => s.status === RiskStatus.HIGH_RISK || s.status === RiskStatus.CRITICAL).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={(isCounselor ? DEPARTMENTS : [user?.department || '']).map(dept => ({
                                            name: dept,
                                            Count: visibleRiskData.filter(s => s.department === dept && (s.status === RiskStatus.HIGH_RISK || s.status === RiskStatus.CRITICAL)).length
                                        })).filter(d => d.Count > 0)}
                                        margin={{ top: 5, right: 30, left: 220, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} width={210} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                                        <Bar dataKey="Count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
                                        <i className="fas fa-shield-alt"></i>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-700">System All Clear</h4>
                                    <p className="text-slate-500 max-w-xs mx-auto mt-2">No high-risk students detected across any department at this time.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mb-4">
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Generate Full Report</h3>
                        <p className="text-slate-500 mb-6 max-w-xs">Download a comprehensive analysis of all department metrics and student risk profiles.</p>
                        <button 
                            onClick={handleDownloadReport}
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                        >
                            Download PDF Report
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- EMAIL ALERTS TAB --- */}
        {activeTab === 'emails' && (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-fade-in-up">
                 <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <i className="fas fa-envelope-open-text text-indigo-500 mr-2"></i> Sent Email Alerts Log
                 </h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4 rounded-l-xl">Date & Time</th>
                                <th className="p-4">Recipient</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Trigger</th>
                                <th className="p-4 rounded-r-xl">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sentEmails.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No email alerts sent yet.</td></tr>
                            ) : sentEmails.map(email => (
                                <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="font-bold">{new Date(email.timestamp).toLocaleDateString()}</div>
                                        <div className="text-xs">{new Date(email.timestamp).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{email.to}</div>
                                        <div className="text-xs text-gray-400">Faculty</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-700 font-medium">
                                        {email.subject}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100">
                                            High Risk Alert
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs font-bold border border-green-100">
                                            <i className="fas fa-check-circle mr-1"></i> Sent
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             </div>
        )}

        {/* --- REPORTS TAB --- */}
        {activeTab === 'reports' && (
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center animate-fade-in-up">
                <i className="fas fa-file-invoice text-6xl text-gray-200 mb-4"></i>
                <h3 className="text-xl font-bold text-slate-700">Reports Center</h3>
                <p className="text-slate-500 mt-2">Customizable report generation coming in next update.</p>
            </div>
        )}



        {/* --- DETAILED STUDENT MODAL --- */}
        {selectedStudent && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-zoom-in">
                    
                    {/* Left Panel: Profile & Snapshot */}
                    <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-100 p-8 flex flex-col overflow-y-auto">
                        <div className="text-center mb-6">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h2>
                            <p className="text-sm text-slate-500 mb-1">{selectedStudent.rollNumber}</p>
                            <p className="text-xs font-bold text-indigo-500 bg-indigo-50 inline-block px-3 py-1 rounded-full">{selectedStudent.department}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                             <div className="bg-white p-3 rounded-xl border border-gray-200 text-center">
                                <div className="text-xs text-gray-400 font-bold uppercase">Streak</div>
                                <div className="text-xl font-bold text-orange-500">{selectedStudent.streak} <span className="text-xs">Days</span></div>
                             </div>
                             <div className="bg-white p-3 rounded-xl border border-gray-200 text-center">
                                <div className="text-xs text-gray-400 font-bold uppercase">Risk</div>
                                <div className={`text-xl font-bold ${selectedStudent.status === RiskStatus.HIGH_RISK ? 'text-red-500' : 'text-green-500'}`}>{selectedStudent.status === RiskStatus.NORMAL ? 'Low' : 'High'}</div>
                             </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-200 mb-6">
                            <h4 className="font-bold text-slate-700 mb-3 text-sm flex items-center"><i className="fas fa-robot text-indigo-500 mr-2"></i> AI Insight Summary</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {selectedStudent.lastSurvey ? (
                                    selectedStudent.lastSurvey.stressLevel > 7 
                                    ? "High stress detected in recent submissions. Correlation with sleep deprivation is strong (r=0.8). Immediate academic workload review advised." 
                                    : "Student demonstrates stable wellness metrics. Sleep consistency has improved by 15% over the last week."
                                ) : "Insufficient data to generate insight."}
                            </p>
                        </div>

                        <div className="mt-auto space-y-3">
                             <button onClick={downloadReport} className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex justify-center items-center">
                                <i className="fas fa-file-download mr-2"></i> Download Report
                             </button>
                             <button onClick={() => setSelectedStudent(null)} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600">Close Profile</button>
                        </div>
                    </div>

                    {/* Right Panel: Analytics & Action */}
                    <div className="w-full md:w-2/3 p-8 flex flex-col overflow-y-auto bg-white">
                        
                        {/* 1. Trend Graph */}
                        <div className="mb-8">
                            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center"><i className="fas fa-chart-area text-indigo-500 mr-2"></i> Wellness Trends (Last 7 Days)</h3>
                            <div className="h-56 bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[...selectedStudent.surveys].reverse().slice(-7).map((s:any) => ({date: s.date.slice(0,5), stress: s.stressLevel, sleep: s.sleepQuality}))}>
                                        <defs>
                                            <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis domain={[0,10]} fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                                        <Area type="monotone" dataKey="stress" stroke="#ef4444" fillOpacity={1} fill="url(#colorStress)" strokeWidth={2} name="Stress" />
                                        <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sleep" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Survey History Table */}
                        <div className="mb-8">
                            <h3 className="font-bold text-slate-800 text-lg mb-4">Recent Check-ins</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 rounded-l-lg">Date</th>
                                            <th className="px-3 py-2">Mood</th>
                                            <th className="px-3 py-2 text-center">Stress</th>
                                            <th className="px-3 py-2 text-center">Sleep</th>
                                            <th className="px-3 py-2 rounded-r-lg">Pressure</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedStudent.surveys.slice(0, 5).map((s: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 text-gray-600">{s.date} {s.time}</td>
                                                <td className="px-3 py-2 font-medium">{s.mood}</td>
                                                <td className="px-3 py-2 text-center font-bold text-red-500">{s.stressLevel}</td>
                                                <td className="px-3 py-2 text-center font-bold text-blue-500">{s.sleepQuality}</td>
                                                <td className="px-3 py-2 text-gray-600">{s.academicPressure}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 3. Faculty Action Panel */}
                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mt-auto">
                            <div className="flex items-center mb-4 text-indigo-900 font-bold">
                                <i className="fas fa-user-md mr-2"></i> Faculty Intervention & Feedback
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-indigo-400 mb-1 uppercase">Update Risk Status</label>
                                    <select 
                                        value={facultyStatus}
                                        onChange={(e) => setFacultyStatus(e.target.value as RiskStatus)}
                                        className="w-full p-2.5 rounded-xl border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                                    >
                                        <option value={RiskStatus.NORMAL}>Normal</option>
                                        <option value={RiskStatus.MODERATE}>Moderate Watch</option>
                                        <option value={RiskStatus.UNDER_OBSERVATION}>Under Observation</option>
                                        <option value={RiskStatus.HIGH_RISK}>High Risk</option>
                                        <option value={RiskStatus.CRITICAL}>Critical</option>
                                        <option value={RiskStatus.COUNSELING_SCHEDULED}>Counseling Scheduled</option>
                                        <option value={RiskStatus.RESOLVED}>Resolved</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-indigo-400 mb-1 uppercase">Recommendation Strategy</label>
                                    <select 
                                        value={facultyRec}
                                        onChange={(e) => setFacultyRec(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                                    >
                                        <option value="">Select Strategy...</option>
                                        <option value="Counseling Session">Counseling Session</option>
                                        <option value="Deep Breathing Routine">Deep Breathing Routine</option>
                                        <option value="Digital Detox Challenge">Digital Detox Challenge</option>
                                        <option value="Academic Planner Setup">Academic Planner Setup</option>
                                        <option value="Sleep Schedule Adjustment">Sleep Schedule Adjustment</option>
                                        <option value="Mindfulness Workshop Referral">Mindfulness Workshop Referral</option>
                                        <option value="Peer Mentorship Assignment">Peer Mentorship Assignment</option>
                                        <option value="Keep under observation">Keep under observation</option>
                                        <option value="Case Resolved">Case Resolved</option>
                                    </select>
                                </div>
                            </div>

                            {/* Counseling Details Inputs - Only if Counseling Scheduled */}
                            {facultyStatus === RiskStatus.COUNSELING_SCHEDULED && (
                                <div className="bg-white p-4 rounded-xl border border-indigo-100 mb-4 space-y-3 animate-fade-in-down">
                                    <h5 className="text-xs font-bold text-indigo-600 uppercase border-b border-indigo-50 pb-2">Counseling Session Details</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500">Date</label>
                                            <input type="date" value={counselingDate} onChange={e => setCounselingDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500">Time</label>
                                            <input type="time" value={counselingTime} onChange={e => setCounselingTime(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500">Counselor Name</label>
                                            <input type="text" value={counselorName} onChange={e => setCounselorName(e.target.value)} placeholder="Dr. Smith" className="w-full p-2 border rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500">Location / Link</label>
                                            <input type="text" value={counselingLocation} onChange={e => setCounselingLocation(e.target.value)} placeholder="Room 302 or Zoom Link" className="w-full p-2 border rounded-lg text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Message to Student</label>
                                        <input type="text" value={counselingMsg} onChange={e => setCounselingMsg(e.target.value)} placeholder="e.g. Please bring your journal." className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                </div>
                            )}
                            
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-indigo-400 mb-1 uppercase">Confidential Notes / Feedback</label>
                                <textarea 
                                    value={facultyNote}
                                    onChange={(e) => setFacultyNote(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none h-20 bg-white resize-none"
                                    placeholder="Add personalized feedback visible to the student..."
                                ></textarea>
                            </div>

                            <button 
                                onClick={submitFacultyIntervention}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex justify-center items-center"
                            >
                                {showSuccessToast ? (
                                    <span><i className="fas fa-check mr-2"></i> Update Saved & Synced</span>
                                ) : (
                                    "Update Student Profile"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
      <Chatbot />
    </Layout>
  );
};

export default AdminDashboard;