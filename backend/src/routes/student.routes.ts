import { Router } from 'express';
import { 
  getProfile, getSurveys, submitSurvey, 
  getRecommendations, getInterventions, submitInterventionResponse,
  getAppointments, bookAppointment, submitAppointmentFeedback,
  getFacultyCounselors, createSupportTicket, getNotifications, getFacultyFeedback,
  getFocusTasks, addFocusTask, toggleFocusTask, deleteFocusTask,
  getGoalHabits, addGoalHabit, updateGoalHabit, deleteGoalHabit
} from '../controllers/student.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Protect all /api/student routes, ensure role === STUDENT
router.use(authenticateToken);
router.use(authorizeRole('STUDENT'));

router.get('/profile', getProfile);
router.get('/surveys', getSurveys);
router.post('/survey', submitSurvey);
router.get('/recommendations', getRecommendations);
router.get('/interventions', getInterventions);
router.post('/intervention-response', submitInterventionResponse);
router.get('/appointments', getAppointments);
router.post('/book-appointment', bookAppointment);
router.post('/appointment-feedback', submitAppointmentFeedback);
router.get('/faculty-counselors', getFacultyCounselors);
router.post('/support-ticket', createSupportTicket);
router.get('/notifications', getNotifications);
router.get('/feedback', getFacultyFeedback);

// Focus Tasks
router.get('/focus-tasks', getFocusTasks);
router.post('/focus-task', addFocusTask);
router.patch('/focus-task', toggleFocusTask);
router.delete('/focus-task/:id', deleteFocusTask);

// Goal Habits
router.get('/goal-habits', getGoalHabits);
router.post('/goal-habit', addGoalHabit);
router.patch('/goal-habit', updateGoalHabit);
router.delete('/goal-habit/:id', deleteGoalHabit);

export default router;
