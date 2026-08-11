import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout/Layout.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import SwipePage from './pages/Swipe/SwipePage.jsx';
import JobsPage from './pages/Jobs/JobsPage.jsx';
import ResumePage from './pages/Resume/ResumePage.jsx';
import RecommendationsPage from './pages/Recommendations/RecommendationsPage.jsx';
import ApplicationsPage from './pages/Applications/ApplicationsPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import NotificationsPage from './pages/Notifications/NotificationsPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import RecruiterPage from './pages/Recruiter/RecruiterPage.jsx';
import AdminPage from './pages/Admin/AdminPage.jsx';

function roleHome(role) {
  if (role === 'admin') return '/admin';
  if (role === 'recruiter') return '/recruiter';
  return '/discover';
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={roleHome(user?.role)} replace />;
  }
  return children;
}

export default function App() {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const homePath = roleHome(user?.role);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#101828',
            border: '1px solid #e5e8ee',
            boxShadow: '0 4px 16px rgba(16,24,40,0.10)',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={homePath} replace />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={homePath} replace />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to={homePath} replace />} />
            <Route path="discover" element={<SwipePage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="resume" element={<ResumePage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="recruiter" element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterPage />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? homePath : "/login"} replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
