import React from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'

export default function NotFoundPage() {
  return (
    <PageShell narrow>
      <div className="py-20 text-center">
        <p className="font-display text-6xl font-semibold text-coral">404</p>
        <p className="mt-3 text-slate">This page swiped left on existing.</p>
        <Link to="/" className="mt-6 inline-block font-medium text-ink hover:text-coral">
          ← Back home
        </Link>
      </div>
    </PageShell>
  )
}
