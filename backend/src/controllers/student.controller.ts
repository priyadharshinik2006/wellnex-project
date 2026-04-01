import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';
import { calculateRisk, calculateOverallWellnessScore } from '../services/risk.service.js';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFacultyCounselors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const faculty = await prisma.user.findMany({
      where: { role: { in: ['FACULTY', 'COUNSELOR', 'ADMIN'] } },
      select: { id: true, name: true, department: true }
    });
    res.json(faculty);
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
        studentRollNumber: req.user.rollNumber || 'UNKNOWN',
        date: new Date(n.date).toLocaleDateString()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFacultyFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedback = await (prisma as any).facultyFeedback.findUnique({
      where: { studentId: req.user.id }
    });
    // Frontend expects an array or finding by roll number
    if (feedback) {
        res.json([{
           ...feedback,
           studentRollNumber: req.user.rollNumber
        }]);
    } else {
        res.json([]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSurveys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const surveys = await prisma.wellnessSurvey.findMany({
      where: { studentId: req.user.id },
      include: { student: true },
      orderBy: { date: 'desc' }
    });
    // Map to frontend expected format
    const formatted = surveys.map(s => ({
        ...s,
        studentRollNumber: (s.student as any)?.rollNumber || 'UNKNOWN',
        date: new Date(s.date).toLocaleDateString(), // Format as "MM/DD/YYYY"
        timestamp: new Date(s.date).getTime()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitSurvey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { stressLevel, sleepQuality, mood, academicPressure, comments } = req.body;
    
    // Risk score calculation based on business logic rules
    const riskScore = await calculateRisk(req.user.id, stressLevel, sleepQuality, academicPressure);
    
    // Additional logic: calculate overall 0-100 wellness score
    const wellnessScore = calculateOverallWellnessScore(stressLevel, sleepQuality, mood, academicPressure);

    const survey = await prisma.wellnessSurvey.create({
      data: {
        studentId: req.user.id,
        stressLevel,
        sleepQuality,
        mood,
        academicPressure,
        riskScore
      }
    });

    if (riskScore > 70) {
      // Find faculty in the same department and ALL counselors
      const student = await prisma.user.findUnique({ where: { id: req.user.id } });
      const targetFaculty = await prisma.user.findMany({
        where: {
          OR: [
            { role: { in: ['COUNSELOR', 'SUPER_ADMIN'] } },
            { role: 'FACULTY', department: student?.department },
            { role: 'ADMIN', department: student?.department }
          ]
        }
      });
      
      const notifications = targetFaculty.map(faculty => ({
        studentId: faculty.id, // Store target user id here for system notification
        message: `High risk alert (Score: ${riskScore}) for student ${student?.name} (${student?.rollNumber || student?.email}). Immediate check-in recommended.`,
        type: 'ALERT'
      }));

      if (notifications.length > 0) {
        await (prisma as any).systemNotification.createMany({
          data: notifications
        });
      }
    }

    res.status(201).json({ message: 'Survey submitted successfully', survey, riskScore, wellnessScore });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createSupportTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await (prisma as any).supportTicket.create({
      data: {
        studentId: req.user.id,
        status: 'PENDING'
      }
    });
    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recommendations = await prisma.recommendation.findMany({
      where: { studentId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInterventions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interventions = await prisma.intervention.findMany({
      where: { studentId: req.user.id },
      include: { assignedBy: { select: { name: true } } },
      orderBy: { assignedDate: 'desc' }
    });
    const formatted = interventions.map(i => ({
        ...i,
        studentRollNumber: req.user.rollNumber || 'UNKNOWN',
        assignedBy: i.assignedBy?.name || 'Faculty',
        assignedDate: new Date(i.assignedDate).toLocaleDateString()
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitInterventionResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
        interventionId, 
        status, 
        missedReason, 
        stressBefore, 
        stressAfter, 
        feedback, 
        rating,
        helpful,
        issueResolved
    } = req.body;
    
    const response = await (prisma as any).interventionResponse.create({
      data: {
        interventionId,
        studentId: req.user.id,
        status,
        missedReason,
        stressBefore: stressBefore || 0,
        stressAfter: stressAfter || 0,
        feedback,
        rating,
        helpful,
        issueResolved
      }
    });
    
    // Update intervention status based on response
    await prisma.intervention.update({
      where: { id: interventionId },
      data: { status: status === 'MISSED' ? 'IN_PROGRESS' : 'COMPLETED' }
    });

    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Focus Tasks ---

export const getFocusTasks = async (req: AuthRequest, res: Response) => {
    try {
        const tasks = await (prisma as any).focusTask.findMany({
            where: { studentId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addFocusTask = async (req: AuthRequest, res: Response) => {
    try {
        const { text } = req.body;
        const task = await (prisma as any).focusTask.create({
            data: { studentId: req.user.id, text }
        });
        res.status(201).json(task);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const toggleFocusTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id, completed } = req.body;
        const task = await (prisma as any).focusTask.update({
            where: { id, studentId: req.user.id },
            data: { completed }
        });
        res.json(task);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteFocusTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await (prisma as any).focusTask.delete({
            where: { id, studentId: req.user.id }
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- Goal Habits ---

export const getGoalHabits = async (req: AuthRequest, res: Response) => {
    try {
        const habits = await (prisma as any).goalHabit.findMany({
            where: { studentId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(habits);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addGoalHabit = async (req: AuthRequest, res: Response) => {
    try {
        const { name, category } = req.body;
        const habit = await (prisma as any).goalHabit.create({
            data: {
                studentId: req.user.id,
                name,
                category,
                completedDays: [false, false, false, false, false, false, false]
            }
        });
        res.status(201).json(habit);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateGoalHabit = async (req: AuthRequest, res: Response) => {
    try {
        const { id, completedDays, streak } = req.body;
        const habit = await (prisma as any).goalHabit.update({
            where: { id, studentId: req.user.id },
            data: { completedDays, streak }
        });
        res.json(habit);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteGoalHabit = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await (prisma as any).goalHabit.delete({
            where: { id, studentId: req.user.id }
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const apps = await prisma.counselingAppointment.findMany({
      where: { studentId: req.user.id },
      include: { counselor: true, student: true },
      orderBy: { date: 'asc' }
    });
    // Format to match frontend
    const formatted = apps.map(a => ({
        ...a,
        studentRollNumber: (a.student as any)?.rollNumber || 'UNKNOWN',
        studentName: (a.student as any)?.name || 'UNKNOWN',
        counselorName: (a.counselor as any)?.name || 'Counselor',
        date: new Date(a.date).toISOString().split('T')[0]
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bookAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { counselorId, date, time } = req.body;
    
    const app = await prisma.counselingAppointment.create({
      data: {
        studentId: req.user.id,
        counselorId,
        date: new Date(date),
        time
      },
      include: {
        counselor: true,
        student: true
      }
    });

    const formatted = {
        ...app,
        studentRollNumber: (app.student as any)?.rollNumber || 'UNKNOWN',
        studentName: (app.student as any)?.name || 'UNKNOWN',
        counselorName: (app.counselor as any)?.name || 'Counselor',
        date: new Date(app.date).toISOString().split('T')[0]
    };

    res.status(201).json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitAppointmentFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId, rating, comment } = req.body;
    
    // Update the appointment
    const updatedAppt = await prisma.counselingAppointment.update({
      where: { id: appointmentId, studentId: req.user.id },
      data: {
        feedback: comment,
        rating
      },
      include: {
        counselor: true
      }
    });

    // Also create an Intervention and InterventionResponse so it shows in the tracking system
    const intervention = await prisma.intervention.create({
      data: {
        studentId: req.user.id,
        assignedById: updatedAppt.counselorId,
        strategy: 'Counseling Session Feedback',
        description: `Feedback automatically generated from session on ${new Date(updatedAppt.date).toLocaleDateString()}`,
        status: 'COMPLETED'
      }
    });

    const response = await prisma.interventionResponse.create({
      data: {
        interventionId: intervention.id,
        studentId: req.user.id,
        stressBefore: 0, // Placeholder
        stressAfter: 0,  // Placeholder
        feedback: comment,
        rating
      }
    });

    res.status(201).json({ updatedAppt, intervention, response });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

