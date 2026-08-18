import { useState, useEffect, useCallback } from 'react'
import { jobService } from '../services/jobService'

export function useJobs(params = {}) {
  const [jobs, setJobs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const key = JSON.stringify(params)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await jobService.list(params)
      setJobs(result.data || [])
      setTotal(result.count || 0)
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [key]) // eslint-disable-line

  useEffect(() => { load() }, [load])
  return { jobs, total, loading, error, reload: load }
}

export function useFeed() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      let data
      try { data = await jobService.feed() }
      catch { const r = await jobService.list({}); data = r.data || [] }
      setJobs(Array.isArray(data) ? data : [])
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  const removeJob = useCallback((id) => setJobs(p => p.filter(j => j.id !== id)), [])
  return { jobs, loading, error, reload: load, removeJob }
}

export function useSeekerStats() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setStats(await jobService.seekerStats()) }
    catch {
      setStats({
        saved_jobs: 0, applied_jobs: 0, swipe_count: 0,
        right_swipes: 0, recommendations: 0, shortlisted: 0,
      })
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Refresh stats whenever a swipe/save/apply action fires the custom event
  useEffect(() => {
    const handler = () => load()
    window.addEventListener('swipex:stats-refresh', handler)
    return () => window.removeEventListener('swipex:stats-refresh', handler)
  }, [load])

  return { stats, loading, reload: load }
}

export function useRecruiterStats() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setStats(await jobService.recruiterStats()) }
    catch {
      setStats({
        total_jobs: 0, active_jobs: 0, draft_jobs: 0,
        closed_jobs: 0, total_applicants: 0,
        new_applications: 0, shortlisted: 0, interviews: 0,
        offers: 0, rejected: 0, average_ats_score: null,
      })
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Refresh recruiter stats on custom events too
  useEffect(() => {
    const handler = () => load()
    window.addEventListener('swipex:stats-refresh', handler)
    return () => window.removeEventListener('swipex:stats-refresh', handler)
  }, [load])

  return { stats, loading, reload: load }
}
