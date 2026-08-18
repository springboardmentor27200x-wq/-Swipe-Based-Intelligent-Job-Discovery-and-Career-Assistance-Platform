import React from 'react'
import { Routes, Route } from 'react-router-dom'

import LandingPage             from './pages/LandingPage'
import RegisterPage            from './pages/RegisterPage'
import LoginPage               from './pages/LoginPage'
import ForgotPasswordPage      from './pages/ForgotPasswordPage'
import ResetPasswordPage       from './pages/ResetPasswordPage'
import VerifyEmailPage         from './pages/VerifyEmailPage'
import DashboardPage           from './pages/DashboardPage'
import ProfilePage             from './pages/ProfilePage'
import NotFoundPage            from './pages/NotFoundPage'
import JobFeedPage             from './pages/JobFeedPage'
import JobDetailPage           from './pages/JobDetailPage'
import SavedJobsPage           from './pages/SavedJobsPage'
import AppliedJobsPage         from './pages/AppliedJobsPage'
import RecruiterJobsPage       from './pages/RecruiterJobsPage'
import RecruiterJobFormPage    from './pages/RecruiterJobFormPage'
import RecruiterApplicantsPage from './pages/RecruiterApplicantsPage'
import ApplicantProfilePage    from './pages/ApplicantProfilePage'
import CompanyProfilePage      from './pages/CompanyProfilePage'
import NotificationsPage       from './pages/NotificationsPage'
import SkillGapPage            from './pages/SkillGapPage'
import ProtectedRoute          from './components/auth/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────── */}
      <Route path="/"                element={<LandingPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />

      {/* ── Authenticated — all roles ───────────────────────────────── */}
      <Route path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* ── Job Seeker — Milestone 4: Skill Gap Analysis ─────────────── */}
      <Route path="/skill-gap" element={
        <ProtectedRoute allowedRoles={['job_seeker']}>
          <SkillGapPage />
        </ProtectedRoute>
      } />

      {/* ── Job Seeker — SPECIFIC routes BEFORE parameterized /:id ──── */}
      <Route path="/jobs/saved" element={
        <ProtectedRoute allowedRoles={['job_seeker']}>
          <SavedJobsPage />
        </ProtectedRoute>
      } />
      <Route path="/jobs/applied" element={
        <ProtectedRoute allowedRoles={['job_seeker']}>
          <AppliedJobsPage />
        </ProtectedRoute>
      } />
      <Route path="/jobs" element={
        <ProtectedRoute allowedRoles={['job_seeker']}>
          <JobFeedPage />
        </ProtectedRoute>
      } />

      {/* ── Public job detail (after specific routes) ───────────────── */}
      <Route path="/jobs/:id" element={<JobDetailPage />} />

      {/* ── Recruiter ───────────────────────────────────────────────── */}
      <Route path="/recruiter/jobs/new" element={
        <ProtectedRoute allowedRoles={['recruiter']}>
          <RecruiterJobFormPage />
        </ProtectedRoute>
      } />
      <Route path="/recruiter/jobs/:id/edit" element={
        <ProtectedRoute allowedRoles={['recruiter']}>
          <RecruiterJobFormPage />
        </ProtectedRoute>
      } />
      <Route path="/recruiter/jobs/:id/applicants" element={
        <ProtectedRoute allowedRoles={['recruiter']}>
          <RecruiterApplicantsPage />
        </ProtectedRoute>
      } />
      <Route path="/recruiter/jobs/:jobId/applicants/:appId" element={
        <ProtectedRoute allowedRoles={['recruiter']}>
          <ApplicantProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/recruiter/jobs" element={
        <ProtectedRoute allowedRoles={['recruiter']}>
          <RecruiterJobsPage />
        </ProtectedRoute>
      } />
      <Route path="/recruiter/company" element={
        <ProtectedRoute allowedRoles={['recruiter']}>
          <CompanyProfilePage />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
