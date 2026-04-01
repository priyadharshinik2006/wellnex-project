import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import facultyRoutes from './routes/faculty.routes.js';
import adminRoutes from './routes/admin.routes.js';
import communityRoutes from './routes/community.routes.js';
import { calculateRisk } from './services/risk.service.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*' // Specify your frontend domain in production
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Decoupled Frontend Trigger Bridge
app.post('/api/public/trigger-survey', async (req, res) => {
  try {
    const { studentId, studentName, studentDept, stressLevel, sleepQuality, academicPressure } = req.body;
    // Calculate risk triggers the email loop if stress > 7
    const riskScore = await calculateRisk(studentId, stressLevel, sleepQuality, academicPressure, studentName, studentDept);
    res.status(200).json({ message: 'Triggered successfully', riskScore });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend static files in production
// Assuming the backend is run from dist/ and relative path to frontend dist/ is ../../dist
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(path.join(__dirname, '../../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist', 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`[Backend] Server is running on port ${PORT}`);
});
