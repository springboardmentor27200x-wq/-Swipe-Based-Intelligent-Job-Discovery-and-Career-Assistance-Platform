import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SwipeXHomepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import OAuthSuccess from "./pages/OAuthSuccess";
import ProtectedRoute from "./components/ProtectedRoute";
import RecruiterDashboard from "./pages/Recruiterdashboard";
import JobSeekerDashboard from "./pages/Jobseekerdashboard";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<SwipeXHomepage />} />
      <Route path="/signup" element={<Signup />} />
      {/* <Route path="/jobseeker-dashboard" element={<JobSeekerDashboard />} />
      <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} /> */}
      <Route path="/oauth-success" element={<OAuthSuccess />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
  path="/jobseeker-dashboard"
  element={
    <ProtectedRoute allowedRoles={["job_seeker", "jobseeker"]}>
      <JobSeekerDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/recruiter-dashboard"
  element={
    <ProtectedRoute allowedRoles={["recruiter"]}>
      <RecruiterDashboard />
    </ProtectedRoute>
  }
/>

    <Route path="/admin-signup" element={<AdminSignup />} />
    <Route
      path="/admin-dashboard"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    </Routes>
  );
}
