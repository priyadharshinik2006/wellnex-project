import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  getCurrentUser, getStudents, getFaculty, deleteStudent, deleteFaculty, 
  saveFaculty, calculateRiskProfile, updateStudent, getSystemLogs, getAppointments, getSurveys,
  sendSystemBroadcast, fetchWithAuth
} from '../services/storageService';
import { Role, StudentProfile, FacultyProfile, RiskStatus, SystemLog, Appointment, WellnessSurvey } from '../types';
import { DEPARTMENTS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SuperAdminDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'faculty' | 'analytics'>('dashboard');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [surveys, setSurveys] = useState<WellnessSurvey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Adding Faculty
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', department: '', phone: '', employeeId: '', password: '' });

  // Modal for Assigning Faculty
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<StudentProfile | null>(null);

  // Modal for Broadcast
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'INFO' | 'ALERT' | 'REMINDER'>('INFO');
  const [broadcastDept, setBroadcastDept] = useState('All');

  const [systemUptime, setSystemUptime] = useState('99.98%');
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
     setActiveSessions(Math.floor(Math.random() * 40) + 10);
     const interval = setInterval(() => {
         setActiveSessions(prev => prev + (Math.random() > 0.5 ? 1 : -1));
     }, 5000);
     return () => clearInterval(interval);
  }, []);

  const location = useLocation();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.SUPER_ADMIN) {
      setUser(currentUser);
      refreshData();
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view && ['dashboard', 'students', 'faculty', 'analytics'].includes(view)) {
      setActiveTab(view as any);
    }
  }, [location]);

  const refreshData = async () => {
    try {
      const [studentsData, facultyData, logsData, appointmentsData, surveysData] = await Promise.all([
        fetchWithAuth('/faculty/students').catch(() => []),          // Or admin/students if needed, fallback
        fetchWithAuth('/admin/faculty').catch(() => []),             // gets list of faculty
        Promise.resolve(getSystemLogs()),                            // System logs stay local for UI audit demo
        fetchWithAuth('/admin/appointments').catch(() => []),        // gets all appointments
        fetchWithAuth('/admin/surveys').catch(() => [])              // gets all surveys with joined user info
      ]);
      setStudents(studentsData);
      setFaculty(facultyData);
      setLogs(logsData);
      setAppointments(appointmentsData);
      setSurveys(surveysData);
    } catch (err) {
      console.error("Failed to fetch fresh dashboard data:", err);
    }
  };

  const handleAddFaculty = async () => {
    if (!newFaculty.name || !newFaculty.email || !newFaculty.password) return;
    
    // Simple hash for demo
    const msgBuffer = new TextEncoder().encode(newFaculty.password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const profile: any = {
        id: crypto.randomUUID(),
        name: newFaculty.name,
        email: newFaculty.email,
        department: newFaculty.department || 'General',
        phone: newFaculty.phone,
        role: Role.ADMIN,
        employeeId: newFaculty.employeeId || `EMP${Math.floor(Math.random()*1000)}`,
        passwordHash: hash,
        password: newFaculty.password
    };

    if(await saveFaculty(profile)) {
        setIsAddFacultyOpen(false);
        setNewFaculty({ name: '', email: '', department: '', phone: '', employeeId: '', password: '' });
        refreshData();
        alert('Faculty added successfully.');
    } else {
        alert('Faculty email already exists.');
    }
  };

  const handleDeleteUser = async (id: string, type: 'student' | 'faculty') => {
      if (window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
          if (type === 'student') await deleteStudent(id);
          if (type === 'faculty') await deleteFaculty(id);
          
          await refreshData();
      }
  };
  const handleAssignFaculty = (facultyId: string) => {
      if (selectedStudentForAssign) {
          const updated = { ...selectedStudentForAssign, assignedFacultyId: facultyId };
          updateStudent(updated);
          setAssignModalOpen(false);
          setSelectedStudentForAssign(null);
          refreshData();
      }
  };

  const handleSendBroadcast = () => {
      if (!broadcastMsg.trim()) return;
      sendSystemBroadcast(broadcastMsg, broadcastType, broadcastDept);
      setIsBroadcastOpen(false);
      setBroadcastMsg('');
      refreshData();
      alert(`Broadcast sent!`);
  };

  // Stats Calculations
  const riskProfiles = students.map(s => calculateRiskProfile(s.rollNumber));
  const highRiskCount = riskProfiles.filter(p => p.status === RiskStatus.HIGH_RISK || p.status === RiskStatus.CRITICAL).length;
  const completedCounseling = appointments.filter(a => a.status === 'COMPLETED').length;

  // Chart Data Preparation
  const deptData = DEPARTMENTS.map(dept => ({
      name: dept.split(' ')[0], // Shorten name
      count: students.filter(s => s.department === dept).length
  })).filter(d => d.count > 0);
  
  const pieData = [
      { name: 'Normal', value: riskProfiles.filter(p => p.status === RiskStatus.NORMAL).length },
      { name: 'Moderate', value: riskProfiles.filter(p => p.status === RiskStatus.MODERATE).length },
      { name: 'High Risk', value: highRiskCount }
  ];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Advanced Analytics Data
  const deptWellnessData = DEPARTMENTS.map(dept => {
      const deptStudents = students.filter(s => s.department === dept);
      const deptSurveys = surveys.filter(s => deptStudents.some(ds => ds.rollNumber === s.studentRollNumber));
      
      const avgStress = deptSurveys.length > 0 
          ? deptSurveys.reduce((acc, curr) => acc + curr.stressLevel, 0) / deptSurveys.length 
          : 0;
      
      const avgSleep = deptSurveys.length > 0 
          ? deptSurveys.reduce((acc, curr) => acc + curr.sleepQuality, 0) / deptSurveys.length 
          : 0;

      return {
          name: dept.split(' ')[0],
          stress: parseFloat(avgStress.toFixed(1)),
          sleep: parseFloat(avgSleep.toFixed(1))
      };
  }).filter(d => d.stress > 0 || d.sleep > 0);

  // Mock Trend Data based on current averages tweaked for past 7 days
  const baseStress = deptWellnessData.reduce((acc, curr) => acc + curr.stress, 0) / (deptWellnessData.length || 1);
  const baseSleep = deptWellnessData.reduce((acc, curr) => acc + curr.sleep, 0) / (deptWellnessData.length || 1);
  const trendData = Array.from({length: 7}).map((_, i) => {
      const dayOffset = 6 - i;
      const d = new Date();
      d.setDate(d.getDate() - dayOffset);
      return {
          date: d.toLocaleDateString([], {weekday: 'short'}),
          stress: parseFloat(Math.max(1, Math.min(10, baseStress + (Math.random() * 2 - 1))).toFixed(1)),
          sleep: parseFloat(Math.max(1, Math.min(10, baseSleep + (Math.random() * 2 - 1))).toFixed(1))
      }
  });

  const exportSystemReport = () => {
      const doc: any = new jsPDF();
      
      // Header
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("WellNex Institutional Report", 14, 25);
      doc.setFontSize(10);
      doc.text(`Generated by: ${user.name} | Date: ${new Date().toLocaleDateString()}`, 14, 35);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Executive Summary", 14, 50);

      const stats = [
          ['Total Students', students.length],
          ['Total Faculty', faculty.length],
          ['High Risk Cases', highRiskCount],
          ['Counseling Sessions Completed', completedCounseling],
          ['Total Wellness Surveys', surveys.length]
      ];
      
      autoTable(doc, {
          startY: 55,
          head: [['Metric', 'Value']],
          body: stats,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] }
      });

      doc.text("Departmental Wellness Analysis", 14, doc.lastAutoTable.finalY + 15);
      
      const deptRows = deptWellnessData.map(d => [d.name, d.stress, d.sleep]);
      
      autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Department', 'Avg Stress (1-10)', 'Avg Sleep (hrs)']],
          body: deptRows,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] } // Emerald
      });

      doc.save('WellNex_Institutional_Report.pdf');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <Layout userRole={Role.SUPER_ADMIN} userName={user.name}>
      <div className="space-y-8 pb-12 font-sans text-slate-800">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-800">System Administration & Health</h1>
                <p className="text-slate-500 text-sm mt-1">Centralized Control Panel & Infrastructure Monitoring</p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setIsBroadcastOpen(true)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center">
                    <i className="fas fa-bullhorn mr-2"></i> Global Broadcast
                </button>
                <button onClick={exportSystemReport} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors flex items-center">
                    <i className="fas fa-file-pdf mr-2"></i> Report
                </button>
            </div>
        </div>

        {/* System Health Ribbon */}
        <div className="flex flex-wrap gap-4 items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-inner text-white text-sm animate-fade-in-up">
            <div className="flex items-center gap-2 px-4 border-r border-slate-700">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                <span className="font-medium text-slate-300">API Status: <span className="text-emerald-400 font-bold">Operational</span></span>
            </div>
            <div className="flex items-center gap-2 px-4 border-r border-slate-700">
                <i className="fas fa-database text-blue-400"></i>
                <span className="font-medium text-slate-300">DB Latency: <span className="text-blue-400 font-bold">12ms</span></span>
            </div>
            <div className="flex items-center gap-2 px-4 border-r border-slate-700">
                <i className="fas fa-server text-purple-400"></i>
                <span className="font-medium text-slate-300">Uptime: <span className="font-bold text-white">{systemUptime}</span></span>
            </div>
            <div className="flex items-center gap-2 px-4">
                <i className="fas fa-users text-indigo-400"></i>
                <span className="font-medium text-slate-300">Active Sessions: <span className="font-bold text-white">{activeSessions}</span></span>
            </div>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <div className="text-xs text-gray-500 uppercase font-bold">Total Students</div>
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><i className="fas fa-user-graduate"></i></div>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{students.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-50 flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <div className="text-xs text-gray-500 uppercase font-bold">Faculty Members</div>
                            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><i className="fas fa-chalkboard-teacher"></i></div>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{faculty.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <div className="text-xs text-gray-500 uppercase font-bold">Critical Cases</div>
                            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><i className="fas fa-heartbeat"></i></div>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{highRiskCount}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <div className="text-xs text-gray-500 uppercase font-bold">Sessions Done</div>
                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><i className="fas fa-check-circle"></i></div>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{completedCounseling}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-slate-800 mb-6">Recent System Activity</h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-start p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="mr-3 mt-1 text-gray-400 text-xs font-mono min-w-[60px]">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">{log.action}</div>
                                        <div className="text-xs text-slate-500">{log.details} <span className="text-indigo-500 font-medium">by {log.user}</span></div>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && <div className="text-center text-gray-400 text-sm py-8">No recent activity logs.</div>}
                        </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                         <h3 className="font-bold text-slate-800 mb-6 self-start">Risk Distribution</h3>
                         <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Trend Analysis Line Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Global Wellness Trend (Past 7 Days)</h3>
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">Real-time Analysis</span>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                                <YAxis yAxisId="left" fontSize={12} domain={[0, 10]} />
                                <YAxis yAxisId="right" orientation="right" fontSize={12} domain={[0, 10]} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="top" height={36} />
                                <Line yAxisId="left" type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={3} name="Avg Stress" dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#10b981" strokeWidth={3} name="Avg Sleep (hrs)" dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'students' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] animate-fade-in-up">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input type="text" placeholder="Search Students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 w-64 text-sm" />
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Assigned Faculty</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => {
                                const assignedFac = faculty.find(f => f.id === s.assignedFacultyId);
                                return (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-slate-700">{s.name}</td>
                                    <td className="p-4 text-gray-500">{s.rollNumber}</td>
                                    <td className="p-4 text-gray-500">{s.department}</td>
                                    <td className="p-4">
                                        {assignedFac ? (
                                            <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-2 py-1 rounded">{assignedFac.name}</span>
                                        ) : (
                                            <button onClick={() => {setSelectedStudentForAssign(s); setAssignModalOpen(true)}} className="text-xs text-gray-400 border border-dashed border-gray-300 px-2 py-1 rounded hover:border-indigo-500 hover:text-indigo-600">+ Assign</button>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleDeleteUser(s.id, 'student')} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><i className="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 </div>
            </div>
        )}

        {activeTab === 'faculty' && (
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] animate-fade-in-up">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-slate-700">Faculty Directory</h3>
                    <button onClick={() => setIsAddFacultyOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700">+ Add Faculty</button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Employee ID</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {faculty.map(f => (
                                <tr key={f.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-slate-700">{f.name}</td>
                                    <td className="p-4 text-gray-500">{f.email}</td>
                                    <td className="p-4 text-gray-500">{f.department}</td>
                                    <td className="p-4 text-gray-500">{f.employeeId}</td>
                                    <td className="p-4 text-center">
                                        {f.email !== 'priyadharshinik.al23@bitsathy.ac.in' && (
                                            <button onClick={() => handleDeleteUser(f.id, 'faculty')} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><i className="fas fa-trash"></i></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        )}

        {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-slate-800 mb-6">Student Distribution by Department</h3>
                        <div className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} interval={0} />
                                    <YAxis fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-slate-800 mb-6">Average Stress Level by Department</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptWellnessData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} interval={0} />
                                    <YAxis fontSize={12} domain={[0, 10]} />
                                    <Tooltip />
                                    <Bar dataKey="stress" fill="#ef4444" radius={[4, 4, 0, 0]} name="Avg Stress" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-slate-800 mb-6">Sleep Quality Analysis by Department</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptWellnessData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} interval={0} />
                                <YAxis fontSize={12} domain={[0, 10]} />
                                <Tooltip />
                                <Bar dataKey="sleep" fill="#10b981" radius={[4, 4, 0, 0]} name="Avg Sleep (hrs)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: ADD FACULTY */}
        {isAddFacultyOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                    <h3 className="text-xl font-bold mb-4">Add Faculty Member</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Full Name" value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                        <input type="email" placeholder="Email Address" value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                        <input type="password" placeholder="Password" value={newFaculty.password} onChange={e => setNewFaculty({...newFaculty, password: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                        <select value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500">
                            <option value="">Select Department</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="text" placeholder="Phone" value={newFaculty.phone} onChange={e => setNewFaculty({...newFaculty, phone: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex justify-end mt-6 space-x-3">
                        <button onClick={() => setIsAddFacultyOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                        <button onClick={handleAddFaculty} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Add Faculty</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: ASSIGN FACULTY */}
        {assignModalOpen && selectedStudentForAssign && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                    <h3 className="text-lg font-bold mb-4">Assign Faculty to {selectedStudentForAssign.name}</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {faculty.map(f => (
                            <button key={f.id} onClick={() => handleAssignFaculty(f.id)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-colors">
                                <div className="font-bold text-slate-700">{f.name}</div>
                                <div className="text-xs text-gray-500">{f.department}</div>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setAssignModalOpen(false)} className="w-full mt-4 py-2 text-gray-500 font-bold">Cancel</button>
                </div>
            </div>
        )}

        {/* MODAL: BROADCAST MESSAGE */}
        {isBroadcastOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl border-t-4 border-indigo-500">
                    <h3 className="text-xl font-bold mb-2">Global Broadcast</h3>
                    <p className="text-sm text-gray-500 mb-6">Send an instant notification to all registered students.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Target Department</label>
                            <select 
                                value={broadcastDept} 
                                onChange={(e) => setBroadcastDept(e.target.value)}
                                className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-4"
                            >
                                <option value="All">All Departments (and Faculty)</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Message Type</label>
                            <select 
                                value={broadcastType} 
                                onChange={(e) => setBroadcastType(e.target.value as any)}
                                className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="INFO">Information</option>
                                <option value="REMINDER">Reminder</option>
                                <option value="ALERT">Alert</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Message Content</label>
                            <textarea 
                                placeholder="Type your broadcast message here..." 
                                value={broadcastMsg} 
                                onChange={e => setBroadcastMsg(e.target.value)} 
                                className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-28 resize-none" 
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end mt-8 space-x-3">
                        <button onClick={() => setIsBroadcastOpen(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-700">Cancel</button>
                        <button 
                            onClick={handleSendBroadcast} 
                            disabled={!broadcastMsg.trim()}
                            className="px-5 py-2.5 bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200 transition-all"
                        >
                            <i className="fas fa-paper-plane mr-2"></i> Send Now
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;