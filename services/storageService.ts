import { StudentProfile, WellnessSurvey, Role, FacultyFeedback, SupportTicket, SystemNotification, RiskStatus, FacultyProfile, SystemLog, Appointment, InterventionAssignment, InterventionResponse } from '../types';
import { STORAGE_KEYS, ADMIN_CREDENTIALS } from '../constants';

// --- Backend Integration Helpers ---
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('wellnex_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API Request failed');
  }
  return response.json();
};

// --- Storage Keys ---
const EXT_KEYS = {
  FACULTY_FEEDBACK: 'swrs_faculty_feedback',
  SUPPORT_TICKETS: 'swrs_support_tickets',
  NOTIFICATIONS: 'swrs_notifications',
  INTERVENTIONS: 'swrs_interventions',
  INTERVENTION_ASSIGNMENTS: 'swrs_intervention_assignments',
  COMMUNITY_POSTS: 'swrs_community_posts',
  FOCUS_TASKS: 'swrs_focus_tasks',
  GOAL_HABITS: 'swrs_goal_habits'
};

// Initialize storage if empty
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FACULTY)) {
    // Init with default faculty from constants
    const defaultFaculty: FacultyProfile = {
        id: 'fac-001',
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        role: Role.ADMIN,
        department: 'Counseling',
        phone: '0000000000',
        passwordHash: 'default_hash_handled_in_auth', // Placeholder
        employeeId: 'FC001'
    };
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify([defaultFaculty]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SURVEYS)) {
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXT_KEYS.FACULTY_FEEDBACK)) {
    localStorage.setItem(EXT_KEYS.FACULTY_FEEDBACK, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXT_KEYS.SUPPORT_TICKETS)) {
    localStorage.setItem(EXT_KEYS.SUPPORT_TICKETS, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXT_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(EXT_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXT_KEYS.INTERVENTIONS)) {
    localStorage.setItem(EXT_KEYS.INTERVENTIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXT_KEYS.INTERVENTION_ASSIGNMENTS)) {
    localStorage.setItem(EXT_KEYS.INTERVENTION_ASSIGNMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXT_KEYS.COMMUNITY_POSTS)) {
    localStorage.setItem(EXT_KEYS.COMMUNITY_POSTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXT_KEYS.FOCUS_TASKS)) {
    localStorage.setItem(EXT_KEYS.FOCUS_TASKS, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXT_KEYS.GOAL_HABITS)) {
    localStorage.setItem(EXT_KEYS.GOAL_HABITS, JSON.stringify([]));
  }
};

initStorage();

// --- Logging ---
export const logSystemAction = (action: string, details: string, user: string) => {
    const logs: SystemLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS) || '[]');
    logs.unshift({
        id: crypto.randomUUID(),
        action,
        details,
        user,
        timestamp: Date.now()
    });
    // Keep last 50 logs
    if (logs.length > 50) logs.pop();
    localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(logs));
};

export const getSystemLogs = (): SystemLog[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS) || '[]');
};

// --- Student CRUD ---

export const getStudents = (): StudentProfile[] => {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  return data ? JSON.parse(data) : [];
};

export const saveStudent = (student: StudentProfile): boolean => {
  const students = getStudents();
  if (students.some(s => s.rollNumber === student.rollNumber || s.email.toLowerCase() === student.email.toLowerCase())) {
    return false; 
  }
  students.push(student);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  logSystemAction('REGISTER_STUDENT', `New student registered: ${student.name}`, 'System');
  return true;
};

export const updateStudent = (updatedStudent: StudentProfile) => {
    const students = getStudents();
    const index = students.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
        students[index] = updatedStudent;
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        return true;
    }
    return false;
};

export const deleteStudent = async (studentId: string) => {
    try {
        await fetchWithAuth(`/admin/user/${studentId}`, { method: 'DELETE' });
        let students = getStudents();
        const student = students.find(s => s.id === studentId);
        if (student) {
            students = students.filter(s => s.id !== studentId);
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
            logSystemAction('DELETE_STUDENT', `Student deleted: ${student.name}`, 'Admin');
        }
    } catch (err) {
        console.error("Failed to delete student", err);
        alert("Action failed. Server error.");
    }
};

export const clearAllLocalData = () => {
    // Clear data keys but KEEP the current user session
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (name !== 'CURRENT_USER') {
            localStorage.removeItem(key);
        }
    });
    Object.values(EXT_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('swrs_appointments');
    localStorage.removeItem('swrs_faculty_feedback');
};

// --- Faculty CRUD ---

export const getFaculty = (): FacultyProfile[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY) || '[]');
};

export const fetchFacultyCounselors = async () => {
    try {
        const counselors = await fetchWithAuth('/student/faculty-counselors');
        return counselors;
    } catch (err) {
        console.error("Failed to fetch counselors", err);
        return [];
    }
};

export const saveFaculty = async (faculty: any): Promise<boolean> => {
    try {
        const response = await fetchWithAuth('/admin/create-faculty', {
            method: 'POST',
            body: JSON.stringify({
                name: faculty.name,
                email: faculty.email,
                password: faculty.password || 'password123',
                role: 'ADMIN', // Always use ADMIN role so faculty can login
                department: faculty.department
            })
        });
        
        // Use the backend-returned ID so deletes/syncs work correctly
        const saved = {
            ...faculty,
            id: response.userId || faculty.id,
            role: Role.ADMIN
        };
        const list = getFaculty();
        list.push(saved);
        localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(list));
        logSystemAction('ADD_FACULTY', `Faculty added: ${faculty.name}`, 'Admin');
        return true;
    } catch (err: any) {
        console.error("Failed to add faculty:", err);
        if (err.message?.includes('already exists')) {
            return false; // Signal duplicate
        }
        return false;
    }
};

export const deleteFaculty = async (facultyId: string) => {
    try {
        await fetchWithAuth(`/admin/user/${facultyId}`, { method: 'DELETE' });
        let list = getFaculty();
        const faculty = list.find(f => f.id === facultyId);
        if (faculty) {
            list = list.filter(f => f.id !== facultyId);
            localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(list));
            logSystemAction('DELETE_FACULTY', `Faculty deleted: ${faculty.name}`, 'Admin');
        }
    } catch (err) {
        console.error("Failed to delete faculty", err);
        alert("Action failed. Server error.");
    }
};

// --- Survey ---

export const getSurveys = (): WellnessSurvey[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SURVEYS);
  return data ? JSON.parse(data) : [];
};

export const saveSurvey = async (survey: WellnessSurvey) => {
  // 1. Save locally for immediate UI update (optimistic)
  const surveys = getSurveys();
  surveys.push(survey);
  localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));

  // 2. Save to Backend
  try {
    await fetchWithAuth('/student/survey', {
      method: 'POST',
      body: JSON.stringify({
        stressLevel: survey.stressLevel,
        sleepQuality: survey.sleepQuality,
        mood: survey.mood,
        academicPressure: survey.academicPressure,
        comments: survey.remarks || ''
      })
    });
    console.log("✅ Survey synced to backend");
  } catch (err) {
    console.error("❌ Failed to sync survey to backend:", err);
  }
};

// --- Sync Tool ---
export const syncWithBackend = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
        if (user.role === Role.STUDENT) {
            const safeSet = async (endpoint: string, key: string) => {
                try {
                    const data = await fetchWithAuth(endpoint);
                    localStorage.setItem(key, JSON.stringify(data));
                } catch(e) {
                    console.error(`Failed syncing ${endpoint}:`, e);
                }
            };
            
            try {
                const profile = await fetchWithAuth('/student/profile');
                setCurrentUser(profile);
            } catch(e) { console.error(`Failed syncing profile:`, e); }

            await Promise.all([
                safeSet('/student/surveys', STORAGE_KEYS.SURVEYS),
                safeSet('/student/appointments', STORAGE_KEYS.APPOINTMENTS),
                safeSet('/student/notifications', EXT_KEYS.NOTIFICATIONS),
                safeSet('/student/interventions', EXT_KEYS.INTERVENTION_ASSIGNMENTS),
                safeSet('/student/focus-tasks', EXT_KEYS.FOCUS_TASKS),
                safeSet('/student/feedback', EXT_KEYS.FACULTY_FEEDBACK),
                safeSet('/student/goal-habits', EXT_KEYS.GOAL_HABITS)
            ]);
        } else if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
            
            // Helper to safely fetch and set
            const safeSet = async (endpoint: string, key: string) => {
                try {
                    const data = await fetchWithAuth(endpoint);
                    localStorage.setItem(key, JSON.stringify(data));
                } catch(e) {
                    console.error(`Failed syncing ${endpoint}:`, e);
                }
            };

            await Promise.all([
                safeSet('/faculty/students', STORAGE_KEYS.STUDENTS),
                safeSet(user.role === Role.ADMIN ? '/faculty/appointments' : '/admin/appointments', STORAGE_KEYS.APPOINTMENTS),
                safeSet('/admin/faculty', STORAGE_KEYS.FACULTY),
                safeSet('/admin/surveys', STORAGE_KEYS.SURVEYS),
                safeSet('/admin/interventions', EXT_KEYS.INTERVENTION_ASSIGNMENTS),
                safeSet('/admin/intervention-responses', EXT_KEYS.INTERVENTIONS),
                safeSet('/admin/support-tickets', EXT_KEYS.SUPPORT_TICKETS),
                safeSet('/admin/faculty-feedback', EXT_KEYS.FACULTY_FEEDBACK),
                safeSet('/admin/notifications', EXT_KEYS.NOTIFICATIONS)
            ]);
        }
        console.log("✅ All data synced from backend");
    } catch (err) {
        console.error("❌ Sync failed:", err);
    }
};

export const getStudentSurveys = (rollNumber: string): WellnessSurvey[] => {
  return getSurveys()
    .filter(s => s.studentRollNumber === rollNumber)
    .sort((a, b) => b.timestamp - a.timestamp);
};

// --- Auth ---

export const loginStudent = (email: string, passwordHash: string): StudentProfile | null => {
  const students = getStudents();
  const student = students.find(s => s.email.toLowerCase() === email.toLowerCase() && s.passwordHash === passwordHash);
  return student || null;
};

export const loginFaculty = (email: string, passwordHash: string): FacultyProfile | null => {
    const list = getFaculty();
    // In a real app, verify hash. Here we check plain text for the default admin, or hash for others.
    return list.find(f => f.email.toLowerCase() === email.toLowerCase() && f.passwordHash === passwordHash) || null;
};

export const resetUserPassword = (email: string, newHash: string, role: Role): boolean => {
    // 1. Check Faculty
    if (role === Role.ADMIN) {
        const facultyList = getFaculty();
        const index = facultyList.findIndex(f => f.email.toLowerCase() === email.toLowerCase());
        
        // Cannot reset default admin credentials in this demo setup as they are hardcoded constants
        if (email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
            return false;
        }

        if (index !== -1) {
            facultyList[index].passwordHash = newHash;
            localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(facultyList));
            logSystemAction('PASSWORD_RESET', `Password reset for faculty: ${email}`, 'System');
            return true;
        }
    }

    // 2. Check Student
    if (role === Role.STUDENT) {
        const students = getStudents();
        const index = students.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
        if (index !== -1) {
            students[index].passwordHash = newHash;
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
            logSystemAction('PASSWORD_RESET', `Password reset for student: ${email}`, 'System');
            return true;
        }
    }
    
    return false;
};

export const setCurrentUser = (user: any) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const getCurrentUser = () => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// --- Faculty Features ---

export const saveFacultyFeedback = async (feedback: FacultyFeedback) => {
  try {
      // Optimistic update
      const allFeedback: FacultyFeedback[] = JSON.parse(localStorage.getItem(EXT_KEYS.FACULTY_FEEDBACK) || '[]');
      const filtered = allFeedback.filter(f => f.studentRollNumber !== feedback.studentRollNumber);
      filtered.push(feedback);
      localStorage.setItem(EXT_KEYS.FACULTY_FEEDBACK, JSON.stringify(filtered));
      
      await fetchWithAuth('/admin/faculty-feedback', {
          method: 'POST',
          body: JSON.stringify(feedback)
      });
  } catch(err) {
      console.error("Failed to save faculty feedback", err);
  }
};

export const getStudentFeedback = (rollNumber: string): FacultyFeedback | null => {
  const allFeedback: FacultyFeedback[] = JSON.parse(localStorage.getItem(EXT_KEYS.FACULTY_FEEDBACK) || '[]');
  return allFeedback.find(f => f.studentRollNumber === rollNumber) || null;
};

// --- Support System ---

export const requestCounselorSupport = async (studentRollNumber: string, studentName: string) => {
  try {
    await fetchWithAuth('/student/support-ticket', {
        method: 'POST'
    });
    // Optimistic Update
    const tickets: SupportTicket[] = JSON.parse(localStorage.getItem(EXT_KEYS.SUPPORT_TICKETS) || '[]');
    if (tickets.some(t => t.studentRollNumber === studentRollNumber && t.status === 'PENDING')) return;

    const newTicket: SupportTicket = {
        id: crypto.randomUUID(),
        studentRollNumber,
        studentName,
        requestDate: new Date().toLocaleDateString(),
        status: 'PENDING',
        timestamp: Date.now()
    };
    tickets.push(newTicket);
    localStorage.setItem(EXT_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));
  } catch (err) {
      console.error("Failed to request support", err);
  }
};

export const getSupportTickets = (): SupportTicket[] => {
  const tickets = JSON.parse(localStorage.getItem(EXT_KEYS.SUPPORT_TICKETS) || '[]');
  return tickets.sort((a: any, b: any) => b.timestamp - a.timestamp);
};

export const updateSupportTicket = async (ticketId: string, status: 'ACCEPTED' | 'RESOLVED', response?: string) => {
  try {
      await fetchWithAuth(`/admin/support-tickets/${ticketId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, facultyResponse: response })
      });
      // Optimistic Update
      const tickets: SupportTicket[] = JSON.parse(localStorage.getItem(EXT_KEYS.SUPPORT_TICKETS) || '[]');
      const index = tickets.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        tickets[index].status = status;
        if (response) tickets[index].facultyResponse = response;
        localStorage.setItem(EXT_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));
      }
  } catch(err) {
      console.error("Failed to update ticket", err);
  }
};

export const getStudentTicketStatus = (rollNumber: string): SupportTicket | null => {
  const tickets = getSupportTickets();
  return tickets.find(t => t.studentRollNumber === rollNumber) || null;
};

// --- Notification System ---

export const sendSystemNotification = async (rollNumber: string, message: string, type: 'REMINDER' | 'ALERT' | 'INFO') => {
  try {
      await fetchWithAuth('/admin/notifications', {
          method: 'POST',
          body: JSON.stringify({ studentRollNumber: rollNumber, message, type })
      });
      // Optimistic Update
      const notifs: SystemNotification[] = JSON.parse(localStorage.getItem(EXT_KEYS.NOTIFICATIONS) || '[]');
      notifs.push({
        id: crypto.randomUUID(),
        studentRollNumber: rollNumber,
        message,
        type,
        date: new Date().toLocaleDateString(),
        isRead: false
      });
      localStorage.setItem(EXT_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  } catch(err) {
      console.error("Failed to send notification", err);
  }
};

export const sendSystemBroadcast = async (message: string, type: 'REMINDER' | 'ALERT' | 'INFO', department: string = 'All') => {
    const students = getStudents();
    const facultyList = getFaculty();
    
    // We send to each individually, in a real app this would be a bulk endpoint
    for (const s of students) {
        if (department === 'All' || s.department === department) {
            sendSystemNotification(s.rollNumber, message, type);
        }
    }

    for (const f of facultyList) {
        sendSystemNotification(f.email, message, type);
    }
    
    logSystemAction('SYSTEM_BROADCAST', `Broadcast sent to ${department}: ${message.substring(0, 30)}...`, 'System Admin');
};

export const getStudentNotifications = (rollNumber: string): SystemNotification[] => {
  const notifs: SystemNotification[] = JSON.parse(localStorage.getItem(EXT_KEYS.NOTIFICATIONS) || '[]');
  return notifs.filter(n => n.studentRollNumber === rollNumber).reverse();
};

export const sendHighRiskEmailAlert = (student: StudentProfile, survey: WellnessSurvey) => {
  // 1. Local Notification
  sendSystemNotification(
    student.rollNumber, 
    "Early Warning: Your wellness metrics indicate high stress. Please review the suggested coping strategies.", 
    "ALERT"
  );

  // 2. Backend Email Trigger
  fetch(`${API_BASE_URL}/public/trigger-survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: student.rollNumber,
      studentName: student.name,
      studentDept: student.department || 'General',
      stressLevel: survey.stressLevel,
      sleepQuality: survey.sleepQuality,
      academicPressure: survey.academicPressure
    })
  }).then(res => {
    if (res.ok) console.log("✅ High risk email alert triggered on backend");
    else console.error("❌ Failed to trigger backend email alert");
  }).catch(err => console.error("❌ Network error triggering email:", err));
};

// --- Appointments ---

export const getAppointments = (): Appointment[] => {
  const data = localStorage.getItem('swrs_appointments');
  return data ? JSON.parse(data) : [];
};

export const bookAppointment = async (appointment: any) => {
  try {
    const res = await fetchWithAuth('/student/book-appointment', {
      method: 'POST',
      body: JSON.stringify(appointment)
    });
    // Optimistic update
    const appointments = getAppointments();
    appointments.push(res);
    localStorage.setItem('swrs_appointments', JSON.stringify(appointments));
    logSystemAction('BOOK_APPOINTMENT', `Appointment booked by ${appointment.studentName}`, 'Student');
    return res;
  } catch (err) {
    console.error("Failed to book appointment", err);
    throw err;
  }
};

export const updateAppointmentStatus = async (id: string, status: 'COMPLETED' | 'MISSED') => {
  try {
    await fetchWithAuth('/faculty/update-appointment-status', {
      method: 'PATCH',
      body: JSON.stringify({ id, status })
    });
    // Optimistic update
    const appointments = getAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].status = status;
      localStorage.setItem('swrs_appointments', JSON.stringify(appointments));
      logSystemAction('UPDATE_APPOINTMENT', `Appointment ${status}: ${appointments[index].studentName}`, 'Admin');
    }
  } catch (err) {
    console.error("Failed to update appointment", err);
    throw err;
  }
};

export const addAppointmentFeedback = async (id: string, rating: number, comment: string) => {
  try {
    await fetchWithAuth('/student/appointment-feedback', {
      method: 'POST',
      body: JSON.stringify({ appointmentId: id, rating, comment })
    });
    // Optimistic update
    const appointments = getAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].feedback = { rating, comment, timestamp: Date.now() };
      localStorage.setItem('swrs_appointments', JSON.stringify(appointments));
      logSystemAction('ADD_FEEDBACK', `Feedback added for appointment with ${appointments[index].counselorName}`, 'Student');
    }
  } catch (err) {
    console.error("Failed to add feedback", err);
    throw err;
  }
};

export const getStudentAppointments = (rollNumber: string): Appointment[] => {
  return getAppointments().filter(a => a.studentRollNumber === rollNumber);
};

// --- Helper for Admin Dashboard ---

export const calculateRiskProfile = (rollNumber: string) => {
  const surveys = getStudentSurveys(rollNumber);
  const feedback = getStudentFeedback(rollNumber);

  let computedStatus = RiskStatus.NORMAL;
  
  if (surveys.length > 0) {
    const latest = surveys[0];
    if (latest.stressLevel >= 8 || latest.sleepQuality <= 3) {
      computedStatus = RiskStatus.HIGH_RISK;
    } else if (latest.stressLevel >= 6 || latest.sleepQuality <= 5) {
      computedStatus = RiskStatus.MODERATE;
    }
  }

  if (feedback && feedback.status !== RiskStatus.NORMAL) {
    computedStatus = feedback.status;
  }

  return {
    status: computedStatus,
    lastSurvey: surveys[0] || null,
    streak: calculateStreak(surveys),
    surveys: surveys
  };
};

const calculateStreak = (data: WellnessSurvey[]) => {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => b.timestamp - a.timestamp);
    let currentStreak = 1;
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date().setHours(0,0,0,0);
    const lastDate = new Date(sorted[0].timestamp).setHours(0,0,0,0);
    
    if ((today - lastDate) > oneDay) return 0;
    
    for (let i = 0; i < sorted.length - 1; i++) {
        const d1 = new Date(sorted[i].timestamp).setHours(0,0,0,0);
        const d2 = new Date(sorted[i+1].timestamp).setHours(0,0,0,0);
        if (d1 - d2 === oneDay) currentStreak++;
        else if (d1 - d2 === 0) continue;
        else break;
    }
    return currentStreak;
};

// --- Interventions ---

export const saveInterventionResponse = (response: InterventionResponse) => {
    const interventions: InterventionResponse[] = JSON.parse(localStorage.getItem(EXT_KEYS.INTERVENTIONS) || '[]');
    interventions.push(response);
    localStorage.setItem(EXT_KEYS.INTERVENTIONS, JSON.stringify(interventions));
    
    // If linked to an assignment, mark it as completed
    if (response.assignmentId) {
        updateInterventionAssignmentStatus(response.assignmentId, 'COMPLETED');
    }

    logSystemAction('SUBMIT_INTERVENTION', `Intervention completed by ${response.studentName}`, 'Student');
};

export const getInterventionResponses = (): InterventionResponse[] => {
    const data = localStorage.getItem(EXT_KEYS.INTERVENTIONS);
    return data ? JSON.parse(data) : [];
};

export const getStudentInterventions = (rollNumber: string): InterventionResponse[] => {
    return getInterventionResponses().filter(i => i.studentRollNumber === rollNumber);
};

// --- Intervention Assignments ---

export const saveInterventionAssignment = async (studentId: string, assignment: InterventionAssignment) => {
    try {
        const res = await fetchWithAuth('/faculty/assign-intervention', {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentId,
                strategy: assignment.strategy,
                description: assignment.description || ''
            })
        });
        const assignments: InterventionAssignment[] = JSON.parse(localStorage.getItem(EXT_KEYS.INTERVENTION_ASSIGNMENTS) || '[]');
        
        // Use the actual backend ID to prevent FK constraint failures later
        assignment.id = res.id || assignment.id;
        
        assignments.push(assignment);
        localStorage.setItem(EXT_KEYS.INTERVENTION_ASSIGNMENTS, JSON.stringify(assignments));
        logSystemAction('ASSIGN_INTERVENTION', `Intervention assigned to ${assignment.studentRollNumber}`, 'Faculty');
    } catch (err) {
        console.error("Failed to assign intervention:", err);
    }
};

export const getStudentInterventionAssignments = (rollNumber: string): InterventionAssignment[] => {
    const assignments: InterventionAssignment[] = JSON.parse(localStorage.getItem(EXT_KEYS.INTERVENTION_ASSIGNMENTS) || '[]');
    return assignments.filter(a => a.studentRollNumber === rollNumber).sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
};

export const getAllInterventionAssignments = (): InterventionAssignment[] => {
    const assignments: InterventionAssignment[] = JSON.parse(localStorage.getItem(EXT_KEYS.INTERVENTION_ASSIGNMENTS) || '[]');
    return assignments.sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
};

export const updateInterventionAssignmentStatus = (id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    const assignments: InterventionAssignment[] = JSON.parse(localStorage.getItem(EXT_KEYS.INTERVENTION_ASSIGNMENTS) || '[]');
    const index = assignments.findIndex(a => a.id === id);
    if (index !== -1) {
        assignments[index].status = status;
        localStorage.setItem(EXT_KEYS.INTERVENTION_ASSIGNMENTS, JSON.stringify(assignments));
    }
};

// --- Peer Community System ---
// --- Community Peer Support ---
export const getCommunityPosts = async () => {
  return await fetchWithAuth('/community/posts');
};

export const saveCommunityPost = async (post: any) => {
  return await fetchWithAuth('/community/posts', {
    method: 'POST',
    body: JSON.stringify(post)
  });
};

export const likeCommunityPost = async (postId: string) => {
  return await fetchWithAuth(`/community/posts/${postId}/like`, {
    method: 'POST'
  });
};

export const addCommunityComment = async (postId: string, comment: any) => {
  return await fetchWithAuth(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment)
  });
};

// --- Suggestion Feedback ---
export const saveSuggestionFeedback = async (feedback: any) => {
  try {
    const res = await fetchWithAuth('/student/intervention-response', {
        method: 'POST',
        body: JSON.stringify(feedback)
    });
    return res;
  } catch (err) {
    console.error("Failed to save suggestion feedback", err);
    throw err;
  }
};
// --- Focus Mode Backend ---

export const getFocusTasks = (): any[] => {
    return JSON.parse(localStorage.getItem(EXT_KEYS.FOCUS_TASKS) || '[]');
};

export const addBackendFocusTask = async (text: string) => {
    try {
        const res = await fetchWithAuth('/student/focus-task', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        const tasks = getFocusTasks();
        tasks.unshift(res);
        localStorage.setItem(EXT_KEYS.FOCUS_TASKS, JSON.stringify(tasks));
        return res;
    } catch (err) {
        console.error('Failed to add focus task', err);
        throw err;
    }
};

export const toggleBackendFocusTask = async (id: string, completed: boolean) => {
    try {
        await fetchWithAuth('/student/focus-task', {
            method: 'PATCH',
            body: JSON.stringify({ id, completed })
        });
        const tasks = getFocusTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index].completed = completed;
            localStorage.setItem(EXT_KEYS.FOCUS_TASKS, JSON.stringify(tasks));
        }
    } catch (err) {
        console.error('Failed to toggle focus task', err);
        throw err;
    }
};

export const deleteBackendFocusTask = async (id: string) => {
    try {
        await fetchWithAuth(`/student/focus-task/${id}`, {
            method: 'DELETE'
        });
        const tasks = getFocusTasks().filter(t => t.id !== id);
        localStorage.setItem(EXT_KEYS.FOCUS_TASKS, JSON.stringify(tasks));
    } catch (err) {
        console.error('Failed to delete focus task', err);
        throw err;
    }
};

// --- Goal Tracker Backend ---

export const getGoalHabits = (): any[] => {
    return JSON.parse(localStorage.getItem(EXT_KEYS.GOAL_HABITS) || '[]');
};

export const addBackendGoalHabit = async (name: string, category: string) => {
    try {
        const res = await fetchWithAuth('/student/goal-habit', {
            method: 'POST',
            body: JSON.stringify({ name, category })
        });
        const habits = getGoalHabits();
        habits.push(res);
        localStorage.setItem(EXT_KEYS.GOAL_HABITS, JSON.stringify(habits));
        return res;
    } catch (err) {
        console.error('Failed to add goal habit', err);
        throw err;
    }
};

export const updateBackendGoalHabit = async (id: string, completedDays: boolean[], streak: number) => {
    try {
        await fetchWithAuth('/student/goal-habit', {
            method: 'PATCH',
            body: JSON.stringify({ id, completedDays, streak })
        });
        const habits = getGoalHabits();
        const index = habits.findIndex(h => h.id === id);
        if (index !== -1) {
            habits[index].completedDays = completedDays;
            habits[index].streak = streak;
            localStorage.setItem(EXT_KEYS.GOAL_HABITS, JSON.stringify(habits));
        }
    } catch (err) {
        console.error('Failed to update goal habit', err);
        throw err;
    }
};

export const deleteBackendGoalHabit = async (id: string) => {
    try {
        await fetchWithAuth(`/student/goal-habit/${id}`, {
            method: 'DELETE'
        });
        const habits = getGoalHabits().filter(h => h.id !== id);
        localStorage.setItem(EXT_KEYS.GOAL_HABITS, JSON.stringify(habits));
    } catch (err) {
        console.error('Failed to delete goal habit', err);
        throw err;
    }
};
