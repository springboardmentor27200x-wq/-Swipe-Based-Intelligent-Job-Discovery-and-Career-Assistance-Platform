import { useState, useEffect, useCallback } from 'react'
import { analyticsService } from '../services/analyticsService'

export function useSeekerDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await analyticsService.seekerDashboard()) }
    catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load }
}

export function useRecruiterDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await analyticsService.recruiterDashboard()) }
    catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load }
}

export function useApplicationHistory() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await analyticsService.applicationHistory()) }
    catch { setData(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  return { data, loading, reload: load }
}

export function useSkillGap(jobId) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await analyticsService.skillGap(jobId)) }
    catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [jobId])

  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load }
}
