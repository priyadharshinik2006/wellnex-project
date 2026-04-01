import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';

export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const whereClause: any = { role: 'STUDENT' };
    if (req.user.role === 'ADMIN' && req.user.department && req.user.department !== 'General' && req.user.department !== 'Counseling') {
       whereClause.department = req.user.department;
    }

    const students = await (prisma.user as any).findMany({
      where: whereClause,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        rollNumber: true,
        department: true,
        year: true,
        phone: true,
        gender: true
      }
    });
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHighRiskStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // "High Risk" can be thresholded against the riskScore stored. Here, arbitrary threshold > 80.
    const whereClause: any = { riskScore: { gt: 80 } };
    if (req.user.role === 'ADMIN' && req.user.department && req.user.department !== 'General' && req.user.department !== 'Counseling') {
       whereClause.student = { department: req.user.department };
    }

    const recentSurveys = await prisma.wellnessSurvey.findMany({
      where: whereClause,
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { date: 'desc' }
    });
    const formatted = recentSurveys.map((s: any) => ({
        ...s,
        studentRollNumber: s.student?.rollNumber || 'UNKNOWN',
        date: new Date(s.date).toLocaleDateString(),
        timestamp: new Date(s.date).getTime()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const assignIntervention = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, strategy, description } = req.body;
    
    const intervention = await prisma.intervention.create({
      data: {
        studentId,
        strategy,
        description,
        assignedById: req.user.id
      }
    });
    res.status(201).json(intervention);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInterventions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignments = await prisma.intervention.findMany({
      where: { assignedById: req.user.id },
      include: { 
        student: { select: { name: true, rollNumber: true, department: true } },
        assignedBy: { select: { name: true } }
      },
      orderBy: { assignedDate: 'desc' }
    });
    const formatted = assignments.map((a: any) => ({
        ...a,
        studentRollNumber: a.student?.rollNumber || 'UNKNOWN',
        studentName: a.student?.name || 'UNKNOWN',
        counselorName: a.assignedBy?.name || 'UNKNOWN',
        assignedDate: new Date(a.assignedDate).toLocaleDateString()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInterventionResponses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // get interventions assigned by THIS faculty
    const responses = await prisma.interventionResponse.findMany({
      where: {
        intervention: {
          assignedById: req.user.id
        }
      },
      include: {
        student: { select: { name: true, rollNumber: true, department: true } as any },
        intervention: { select: { strategy: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = responses.map((r: any) => ({
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

export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const apps = await prisma.counselingAppointment.findMany({
      where: { counselorId: req.user.id },
      include: { student: { select: { name: true, email: true, rollNumber: true } as any } },
      orderBy: { date: 'asc' }
    });
    const formatted = apps.map((a: any) => ({
        ...a,
        studentRollNumber: a.student?.rollNumber || 'UNKNOWN',
        studentName: a.student?.name || 'UNKNOWN',
        counselorName: req.user?.name || 'UNKNOWN',
        date: new Date(a.date).toLocaleDateString()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, status } = req.body;
    const defaultValidStatus = ['SCHEDULED', 'COMPLETED', 'MISSED'];
    
    if (!defaultValidStatus.includes(status)) {
       res.status(400).json({ error: 'Invalid status' });
       return;
    }

    const app = await prisma.counselingAppointment.update({
      where: { id },
      data: { status }
    });
    res.json(app);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveInterventionResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentRollNumber, strategy, assignmentId, ...rest } = req.body;
    
    // Lookup student
    const student = await (prisma.user as any).findUnique({
       where: { rollNumber: studentRollNumber }
    });

    if (!student) {
       res.status(404).json({ error: 'Student not found' });
       return;
    }

    const savedResponse = await (prisma as any).interventionResponse.create({
      data: {
        studentId: student.id,
        interventionId: assignmentId || null,
        strategy: strategy,
        response: rest as any
      }
    });

    // If it was an assignment, update status
    if (assignmentId) {
       await prisma.intervention.update({
         where: { id: assignmentId },
         data: { status: 'COMPLETED' }
       });
    }

    res.status(201).json(savedResponse);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
