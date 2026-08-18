import React from 'react'
import PageShell from '../components/layout/PageShell'
import { useAuth } from '../store/AuthContext'
import JobSeekerDashboard from '../components/dashboards/JobSeekerDashboard'
import RecruiterDashboard from '../components/dashboards/RecruiterDashboard'
import AdminDashboard from '../components/dashboards/AdminDashboard'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <PageShell>
      {user.role === 'job_seeker' && <JobSeekerDashboard user={user} />}
      {user.role === 'recruiter'  && <RecruiterDashboard user={user} />}
      {user.role === 'admin'      && <AdminDashboard user={user} />}
    </PageShell>
  )
}
