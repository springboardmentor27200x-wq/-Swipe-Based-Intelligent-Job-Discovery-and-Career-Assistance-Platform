import React, { useState, useCallback } from 'react'
import PageShell from '../components/layout/PageShell'
import SwipeDeck from '../components/jobs/SwipeDeck'
import JobCard from '../components/jobs/JobCard'
import JobFilters from '../components/jobs/JobFilters'
import { useFeed } from '../hooks/useJobs'
import { useAuth } from '../store/AuthContext'

const EMPTY_FILTERS = {
  work_mode: '', job_type: '', experience_level: '',
  company_type: '', competition_level: '', location: '',
  fresher_friendly: '', low_competition: '', recently_posted: '',
}

export default function JobFeedPage() {
  const { user } = useAuth()
  const [view, setView]               = useState('swipe')
  const [filters, setFilters]         = useState(EMPTY_FILTERS)
  const [search, setSearch]           = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { jobs, loading, error, removeJob, reload } = useFeed()

  const displayed = jobs.filter(job => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !job.title?.toLowerCase().includes(q) &&
        !job.company_name?.toLowerCase().includes(q) &&
        !(job.skills || []).some(s => s.toLowerCase().includes(q))
      ) return false
    }
    if (filters.work_mode && job.work_mode !== filters.work_mode) return false
    if (filters.job_type && job.job_type !== filters.job_type) return false
    if (filters.experience_level && job.experience_level !== filters.experience_level) return false
    if (filters.company_type && job.company_type !== filters.company_type) return false
    if (filters.competition_level && job.competition_level !== filters.competition_level) return false
    if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
    if (filters.fresher_friendly === 'true' && !job.is_fresher_friendly) return false
    if (filters.low_competition === 'true' && job.competition_level !== 'low') return false
    return true
  })

  const handleSwiped = useCallback((jobId) => {
    removeJob(jobId)
  }, [removeJob])

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Job Feed</h1>
          <p className="text-slate text-sm mt-1">
            {loading ? 'Loading…' : `${displayed.length} jobs available`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-ink/10 overflow-hidden">
            <button onClick={() => setView('swipe')}
              className={`px-4 py-2 text-sm font-medium transition ${view === 'swipe' ? 'bg-ink text-paper' : 'text-slate hover:bg-sand'}`}>
              Swipe
            </button>
            <button onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium transition ${view === 'list' ? 'bg-ink text-paper' : 'text-slate hover:bg-sand'}`}>
              List
            </button>
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`rounded-xl px-4 py-2 text-sm font-medium border transition ${
              showFilters ? 'border-coral text-coral bg-coral/5' : 'border-ink/10 text-slate hover:border-ink/20'
            }`}>
            {Object.values(filters).some(v => v) ? '● Filters' : 'Filters'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs, companies, skills…"
          className="w-full rounded-xl border border-sand px-4 py-3 text-sm text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-coral/30"
        />
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0">
            <div className="rounded-card border border-ink/8 bg-white p-5 shadow-card">
              <JobFilters
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(EMPTY_FILTERS)}
              />
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-coral border-t-transparent animate-spin" />
              <p className="text-slate text-sm">Loading jobs for you…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-card bg-coral/10 p-8 text-center">
              <p className="text-coral font-medium">Failed to load jobs.</p>
              <button onClick={reload}
                className="mt-3 rounded-xl bg-coral px-5 py-2 text-sm text-white">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && view === 'swipe' && (
            <div className="relative mx-auto" style={{ maxWidth: 440, height: 580 }}>
              {displayed.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="text-5xl mb-4">🎉</div>
                  <p className="font-display text-2xl font-semibold text-ink">All caught up!</p>
                  <p className="text-slate mt-2 text-sm">
                    No more jobs match your filters. Try adjusting them or check back later.
                  </p>
                  <button onClick={() => setFilters(EMPTY_FILTERS)}
                    className="mt-4 rounded-xl bg-coral px-5 py-2.5 text-sm font-medium text-white">
                    Clear filters
                  </button>
                </div>
              ) : (
                <SwipeDeck jobs={displayed} onSwiped={handleSwiped} />
              )}
            </div>
          )}

          {!loading && !error && view === 'list' && (
            <div className="space-y-4">
              {displayed.length === 0 && (
                <div className="py-16 text-center text-slate">
                  No jobs match your current filters.
                </div>
              )}
              {displayed.map(job => (
                <JobCard key={job.id} job={job} showActions />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
