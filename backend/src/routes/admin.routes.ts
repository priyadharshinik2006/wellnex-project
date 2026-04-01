import { Router } from 'express';
import { 
  getSystemStats, getDepartments, getAnalytics, createFacultyOrCounselor,
  getAllFaculty, getAllAppointments, getAllSurveys, deleteUser,
  getAllInterventions, getAllInterventionResponses, getAllSupportTickets, updateSupportTicketStatus,
  createNotification, getNotifications, getAllFacultyFeedback, saveFacultyFeedback
} from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Protect endpoints for ADMIN and SUPER_ADMIN
router.use(authenticateToken);
router.use(authorizeRole('ADMIN', 'SUPER_ADMIN'));

router.get('/system-stats', getSystemStats);
router.get('/departments', getDepartments);
router.get('/analytics', getAnalytics);

router.get('/faculty', getAllFaculty);
router.get('/appointments', getAllAppointments);
router.get('/surveys', getAllSurveys);

router.get('/interventions', getAllInterventions);
router.get('/intervention-responses', getAllInterventionResponses);
router.get('/support-tickets', getAllSupportTickets);
router.patch('/support-tickets/:id', updateSupportTicketStatus);
router.get('/notifications', getNotifications);
router.post('/notifications', createNotification);
router.get('/faculty-feedback', getAllFacultyFeedback);
router.post('/faculty-feedback', saveFacultyFeedback);

// Since both reuse logic, we route logically:
router.post('/create-faculty', createFacultyOrCounselor);
router.post('/create-counselor', createFacultyOrCounselor);
router.delete('/user/:id', deleteUser);

export default router;
