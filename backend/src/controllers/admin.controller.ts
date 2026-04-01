import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';

export const getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalFaculty = await prisma.user.count({ where: { role: 'FACULTY' } });
    const totalSurveys = await prisma.wellnessSurvey.count();
    const activeInterventions = await prisma.intervention.count({ where: { status: 'IN_PROGRESS' } });
    
    res.json({
      totalStudents,
      totalFaculty,
      totalSurveys,
      activeInterventions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await prisma.user.findMany({
      where: { department: { not: null } },
      select: { department: true },
      distinct: ['department']
    });
    res.json(departments.map(d => d.department));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Analytics for department comparison
    const surveys = await prisma.wellnessSurvey.findMany({
      include: {
        student: { select: { department: true } }
      }
    });

    // Grouping logic
    const departmentStats: Record<string, { highRisk: number, mediumRisk: number, lowRisk: number }> = {};
    
    surveys.forEach(survey => {
      const dept = survey.student?.department || 'Unknown';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { highRisk: 0, mediumRisk: 0, lowRisk: 0 };
      }
      
      const risk = survey.riskScore || 0;
      if (risk > 70) departmentStats[dept].highRisk++;
      else if (risk > 40) departmentStats[dept].mediumRisk++;
      else departmentStats[dept].lowRisk++;
    });

    res.json(departmentStats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createFacultyOrCounselor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department } = req.body;

    // Accept FACULTY, COUNSELOR, or ADMIN role for faculty creation
    const allowedRoles = ['FACULTY', 'COUNSELOR', 'ADMIN'];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ error: 'Role must be FACULTY, ADMIN, or COUNSELOR' });
      return;
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'ADMIN', // Default to ADMIN for faculty
        department
      }
    });

    res.status(201).json({ message: `Faculty account created successfully`, userId: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'A user with this email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

export const getAllFaculty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await (prisma.user as any).findMany({
      where: { role: { in: ['FACULTY', 'COUNSELOR', 'ADMIN'] } },
      select: { id: true, name: true, email: true, department: true, phone: true, role: true }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const apps = await (prisma.counselingAppointment as any).findMany({
       include: { 
         student: { select: { name: true, rollNumber: true } },
         counselor: { select: { name: true } }
       },
       orderBy: { date: 'desc' }
    });
    const formatted = apps.map((a: any) => ({
        ...a,
        studentRollNumber: a.student?.rollNumber || 'UNKNOWN',
        studentName: a.student?.name || 'UNKNOWN',
        counselorName: a.counselor?.name || 'UNKNOWN',
        date: new Date(a.date).toLocaleDateString()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllSurveys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const surveys = await (prisma.wellnessSurvey as any).findMany({
       include: { student: { select: { name: true, rollNumber: true, department: true } } },
       orderBy: { date: 'desc' }
    });
    const formatted = surveys.map((s: any) => ({
        ...s,
        studentRollNumber: s.student?.rollNumber || 'UNKNOWN',
        studentName: s.student?.name || 'UNKNOWN',
        department: s.student?.department || 'UNKNOWN',
        date: new Date(s.date).toLocaleDateString(),
        time: new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(s.date).getTime()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllInterventions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignments = await prisma.intervention.findMany({
       include: { 
         student: { select: { name: true, rollNumber: true, department: true } },
         assignedBy: { select: { name: true } }
       },
       orderBy: { assignedDate: 'desc' }
    });
    const formatted = assignments.map(a => ({
        ...a,
        studentRollNumber: a.student?.rollNumber || 'UNKNOWN',
        studentName: a.student?.name || 'UNKNOWN',
        assignedBy: a.assignedBy?.name || 'UNKNOWN',
        assignedDate: new Date(a.assignedDate).toLocaleDateString()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllInterventionResponses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const responses = await prisma.interventionResponse.findMany({
       include: { 
         student: { select: { name: true, rollNumber: true } },
         intervention: { select: { strategy: true } }
       },
       orderBy: { createdAt: 'desc' }
    });
    const formatted = responses.map(r => ({
        ...r,
        studentRollNumber: r.student?.rollNumber || 'UNKNOWN',
        studentName: r.student?.name || 'UNKNOWN',
        assignmentId: r.interventionId,
        strategy: r.intervention?.strategy || 'Unknown Strategy'
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllSupportTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tickets = await (prisma as any).supportTicket.findMany({
       include: { student: { select: { name: true, rollNumber: true } } },
       orderBy: { timestamp: 'desc' }
    });
    const formatted = tickets.map((t: any) => ({
        ...t,
        studentRollNumber: t.student?.rollNumber || 'UNKNOWN',
        studentName: t.student?.name || 'UNKNOWN',
        requestDate: new Date(t.requestDate).toLocaleDateString()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSupportTicketStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, facultyResponse } = req.body;
    const ticket = await (prisma as any).supportTicket.update({
      where: { id },
      data: { status, facultyResponse }
    });
    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentRollNumber, message, type } = req.body;
    let student = await prisma.user.findUnique({ where: { rollNumber: studentRollNumber } });
    if (!student) {
        student = await prisma.user.findUnique({ where: { email: studentRollNumber } });
    }
    if (!student) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const notification = await (prisma as any).systemNotification.create({
      data: {
        studentId: student.id,
        message,
        type
      }
    });
    res.status(201).json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllFacultyFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedbacks = await (prisma as any).facultyFeedback.findMany({
      include: { student: { select: { rollNumber: true } } }
    });
    const formatted = feedbacks.map((f: any) => ({
      ...f,
      studentRollNumber: f.student?.rollNumber
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveFacultyFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentRollNumber, status, recommendation, strategy, facultyNotes, assignedBy, counselingDetails, resolutionDate } = req.body;
    const student = await prisma.user.findUnique({ where: { rollNumber: studentRollNumber } });
    if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
    }
    
    // Upsert the feedback since we only keep the latest one
    const feedback = await (prisma as any).facultyFeedback.upsert({
      where: { studentId: student.id },
      update: {
        status, recommendation, strategy, facultyNotes, assignedBy,
        counselingDetails: counselingDetails || null,
        resolutionDate: resolutionDate || null,
        lastUpdated: new Date()
      },
      create: {
        studentId: student.id,
        status, recommendation, strategy, facultyNotes, assignedBy,
        counselingDetails: counselingDetails || null,
        resolutionDate: resolutionDate || null
      }
    });
    
    // Also update student risk score? (Not explicitly required here)
    res.status(200).json(feedback);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifs = await (prisma as any).systemNotification.findMany({
      where: { studentId: req.user.id },
      orderBy: { date: 'desc' },
      take: 50
    });
    const formatted = notifs.map((n: any) => ({
        ...n,
        studentRollNumber: req.user.email,
        date: new Date(n.date).toLocaleDateString()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.user.delete({
      where: { id }
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
