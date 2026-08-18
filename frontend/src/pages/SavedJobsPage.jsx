import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import JobCard from '../components/jobs/JobCard'
import { jobService } from '../services/jobService'

export default function SavedJobsPage() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')

  const load = () => {
    setLoading(true)
    jobService.savedJobs()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleUnsave = async (jobId) => {
    try {
      await jobService.unsaveJob(jobId)
      setItems(prev => prev.filter(s => s.job !== jobId && s.job_detail?.id !== jobId))
      setMsg('Job removed from saved list and will reappear in your Discover feed.')
      // Notify dashboard to refresh stats
      window.dispatchEvent(new Event('swipex:stats-refresh'))
      setTimeout(() => setMsg(''), 3000)
    } catch (e) {
      console.error('Unsave failed', e)
    }
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Saved Jobs</h1>
          <p className="text-slate text-sm mt-1">
            {loading ? 'Loading…' : `${items.length} saved job${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/jobs"
          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90 transition">
          Browse More
        </Link>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal">
          {msg}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="py-16 text-center rounded-card border border-dashed border-ink/15">
          <p className="text-4xl mb-3">♥</p>
          <p className="font-display text-xl text-ink">No saved jobs yet</p>
          <p className="mt-1 text-sm text-slate">Swipe right or click Save on any job to bookmark it here.</p>
          <Link to="/jobs"
            className="mt-4 inline-block rounded-xl bg-coral px-5 py-2.5 text-sm font-medium text-white">
            Browse Jobs
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const jobData = item.job_detail || item
          return (
            <JobCard
              key={item.id || jobData.id}
              job={{ ...jobData, is_saved: true }}
              showActions
              onUnsave={() => handleUnsave(jobData.id)}
            />
          )
        })}
      </div>
    </PageShell>
  )
}
