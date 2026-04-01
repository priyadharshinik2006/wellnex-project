import { Router } from 'express';
import { 
  getStudents, getHighRiskStudents, assignIntervention, 
  getInterventionResponses, getAppointments, updateAppointmentStatus,
  saveInterventionResponse, getInterventions
} from '../controllers/faculty.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();

// Protect endpoints for FACULTY and COUNSELOR
router.use(authenticateToken);
router.use(authorizeRole('FACULTY', 'COUNSELOR', 'ADMIN', 'SUPER_ADMIN'));

router.get('/students', getStudents);
router.get('/high-risk', getHighRiskStudents);
router.post('/assign-intervention', assignIntervention);
router.post('/intervention/response', saveInterventionResponse);
router.get('/appointments', getAppointments);
router.patch('/update-appointment-status', updateAppointmentStatus);
router.get('/interventions', getInterventions);
router.get('/intervention-responses', getInterventionResponses);

export default router;
