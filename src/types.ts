export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface WellnessSurvey {
  id: string;
  studentId: string;
  date: string;
  stressLevel: number; // 1-10
  sleepQuality: number; // 1-10
  mood: 'happy' | 'neutral' | 'sad' | 'anxious' | 'stressed';
  academicPressure: number; // 1-10
  comments: string;
  aiAnalysis?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Intervention {
  id: string;
  studentId: string;
  assignedBy: string; // Faculty ID
  title: string;
  description: string;
  type: 'counseling' | 'breathing' | 'digital_detox' | 'sleep_plan' | 'stress_management';
  status: 'pending' | 'completed';
  feedback?: string;
  assignedDate: string;
  completedDate?: string;
}

export interface Appointment {
  id: string;
  studentId: string;
  counselorId: string; // Could be a faculty member or dedicated counselor
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface WellnessReport {
  studentId: string;
  averageStress: number;
  averageSleep: number;
  riskTrend: 'improving' | 'stable' | 'worsening';
  recommendations: string[];
}
