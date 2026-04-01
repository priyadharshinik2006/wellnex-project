import React, { PropsWithChildren } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import StudentDashboard from './pages/StudentDashboard';
import StudentSurvey from './pages/StudentSurvey';
import WellnessInsights from './pages/WellnessInsights';
import CounselorSupport from './pages/CounselorSupport';
import AIJournal from './pages/AIJournal';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Help from './pages/Help';
import FocusTimer from './pages/FocusTimer';
import GoalTracker from './pages/GoalTracker';
import PeerCommunity from './pages/PeerCommunity';
import StudentInterventions from './pages/StudentInterventions';
import Broadcasts from './pages/Broadcasts';
import { getCurrentUser } from './services/storageService';
import { Role } from './types';

// Protected Route Component
interface ProtectedRouteProps {
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<PropsWithChildren<ProtectedRouteProps>> = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === Role.SUPER_ADMIN) return <Navigate to="/super-admin-dashboard" replace />;
    if (user.role === Role.ADMIN) return <Navigate to="/admin-dashboard" replace />;
    if (user.role === Role.STUDENT) return <Navigate to="/student-dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Public Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<Help />} />

        {/* Auth Routes */}
        <Route path="/login/:type" element={<Auth />} />
        <Route path="/register/:type" element={<Auth />} />
        <Route path="/reset-password/:token" element={<Auth />} />

        {/* Protected Student Routes */}
        <Route 
          path="/student-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/focus-timer" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <FocusTimer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/goal-tracker" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <GoalTracker />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/community" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <PeerCommunity />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student-survey" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <StudentSurvey />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student-interventions" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <StudentInterventions />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/broadcasts" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT, Role.ADMIN]}>
              <Broadcasts />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wellness-insights" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <WellnessInsights />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/counselor-support" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <CounselorSupport />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-journal" 
          element={
            <ProtectedRoute allowedRoles={[Role.STUDENT]}>
              <AIJournal />
            </ProtectedRoute>
          } 
        />

        {/* Protected Admin (Faculty) Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Super Admin Routes */}
        <Route 
          path="/super-admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;