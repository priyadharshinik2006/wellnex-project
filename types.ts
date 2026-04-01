export enum Role {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN', // Represents Faculty
  SUPER_ADMIN = 'SUPER_ADMIN' // Represents System Admin
}

export enum StressLevel {
  LOW = 'LOW', // 1-4
  MODERATE = 'MODERATE', // 5-7
  HIGH = 'HIGH' // 8-10
}

export enum RiskStatus {
  NORMAL = 'NORMAL',
  MODERATE = 'MODERATE',
  HIGH_RISK = 'HIGH_RISK',
  CRITICAL = 'CRITICAL',
  UNDER_OBSERVATION = 'UNDER_OBSERVATION',
  COUNSELING_SCHEDULED = 'COUNSELING_SCHEDULED',
  RESOLVED = 'RESOLVED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface StudentProfile extends User {
  rollNumber: string;
  department: string;
  year: string;
  phone: string;
  gender: string;
  passwordHash: string;
  assignedFacultyId?: string; // ID of the faculty member assigned
}

export interface FacultyProfile extends User {
  department: string;
  phone: string;
  passwordHash: string;
  employeeId: string;
}

export interface WellnessSurvey {
  id: string;
  studentRollNumber: string;
  stressLevel: number; // 1-10
  sleepQuality: number; // 1-10
  academicPressure: number; // 1-10
  mood: string;
  remarks?: string;
  date: string;
  time: string;
  timestamp: number; // For sorting
}

export interface Recommendation {
  category: 'General' | 'Time Management' | 'Coping Strategy' | 'Professional Help' | 'Holistic Maintenance' | 'Cognitive Load Management' | 'Clinical Intervention Required';
  message: string;
  isUrgent: boolean;
}

export interface CounselingDetails {
  date: string;
  time: string;
  counselorName: string;
  location: string;
  message: string;
}

// New Types for Faculty-Student Interaction
export interface FacultyFeedback {
  studentRollNumber: string;
  status: RiskStatus;
  recommendation: string;
  strategy?: string;
  facultyNotes: string;
  lastUpdated: number;
  assignedBy: string;
  resolutionDate?: string;
  counselingDetails?: CounselingDetails;
}

export interface InterventionAssignment {
  id: string;
  studentRollNumber: string;
  facultyId: string;
  facultyName: string;
  strategy: string;
  description: string;
  assignedDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  notes?: string;
}

export interface InterventionResponse {
  id: string;
  assignmentId?: string;
  studentRollNumber: string;
  studentName: string;
  strategy: string;
  completionDate: string;
  responses: Record<string, any>;
  timestamp: number;
  stressBefore?: number;
  stressAfter?: number;
}

export interface SupportTicket {
  id: string;
  studentRollNumber: string;
  studentName: string;
  requestDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'RESOLVED';
  facultyResponse?: string;
  timestamp: number;
}

export interface SystemNotification {
  id: string;
  studentRollNumber: string;
  type: 'REMINDER' | 'ALERT' | 'INFO';
  message: string;
  date: string;
  isRead: boolean;
}

export interface Appointment {
  id: string;
  studentRollNumber: string;
  studentName: string;
  counselorId: string;
  counselorName: string;
  date: string;
  time: string;
  type: 'ONLINE' | 'IN_PERSON';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
  notes?: string;
  feedback?: {
    rating: number;
    comment: string;
    timestamp: number;
  };
}

export interface SystemLog {
  id: string;
  action: string;
  user: string;
  timestamp: number;
  details: string;
}