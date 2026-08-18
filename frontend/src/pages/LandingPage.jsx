import React from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'

const STACK_CARDS = [
  { title: 'Product Designer', company: 'Loop & Co.', tag: 'Remote · Full-time', rotate: '-rotate-6', offset: 'translate-x-10 -translate-y-2' },
  { title: 'Backend Engineer', company: 'Northbeam', tag: 'Hybrid · Full-time', rotate: 'rotate-3', offset: '-translate-x-6 translate-y-1' },
  { title: 'Growth Analyst', company: 'Fernweh Labs', tag: 'Onsite · Internship', rotate: '-rotate-1', offset: 'translate-y-6' },
]

const MODULES = [
  { n: '01', t: 'Swipe to discover', d: 'Right to apply or save, left to skip. Every gesture sharpens what comes next.' },
  { n: '02', t: 'AI resume analysis', d: 'ATS scoring, missing-keyword detection, and concrete suggestions for every role.' },
  { n: '03', t: 'Real-time competition', d: 'See applicant counts and competition levels before you spend your shot.' },
  { n: '04', t: 'Built for every seat', d: 'Job seekers, recruiters, and admins each get a workspace tuned to their job.' },
]

export default function LandingPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="grid items-center gap-12 py-8 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-block rounded-full bg-sand px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate">
            Milestone 1 · Core platform
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Swipe into your
            <br />
            next <span className="text-coral">role</span>.
          </h1>
          <p className="mt-6 max-w-md text-lg text-slate">
            SwipeX pairs an intuitive swipe interface with AI resume analysis so
            candidates spend their energy on jobs they can actually win.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-coral px-6 py-3 text-[15px] font-medium text-white hover:bg-coral/90"
            >
              Create your account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-ink/15 px-6 py-3 text-[15px] font-medium text-ink hover:bg-sand/60"
            >
              I already have one
            </Link>
          </div>
        </div>

        {/* Signature element: stacked swipe cards */}
        <div className="relative mx-auto h-80 w-full max-w-sm">
          {STACK_CARDS.map((card, i) => (
            <div
              key={card.title}
              className={`absolute inset-x-6 top-4 rounded-card border border-ink/8 bg-white p-6 shadow-card transition ${card.rotate} ${card.offset}`}
              style={{ zIndex: STACK_CARDS.length - i }}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-coral">{card.tag}</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">{card.title}</h3>
              <p className="text-sm text-slate">{card.company}</p>
              <div className="mt-6 flex justify-between text-xs text-slate/70">
                <span>← skip</span>
                <span>apply →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Module strip */}
      <section className="mt-16 border-t border-ink/8 pt-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.n}>
              <span className="font-display text-sm text-coral">{m.n}</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink">{m.t}</h3>
              <p className="mt-1 text-sm text-slate">{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role CTA */}
      <section className="mt-16 grid gap-4 rounded-card border border-ink/8 bg-white p-8 shadow-card sm:grid-cols-3">
        <div>
          <h4 className="font-display text-lg font-semibold text-ink">Job Seekers</h4>
          <p className="mt-1 text-sm text-slate">Build a profile, upload resumes, swipe into your shortlist.</p>
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold text-ink">Recruiters</h4>
          <p className="mt-1 text-sm text-slate">Post roles and track applicants from a single dashboard.</p>
        </div>
        <div>
          <h4 className="font-display text-lg font-semibold text-ink">Admins</h4>
          <p className="mt-1 text-sm text-slate">Oversee the platform — users, recruiters, and activity, in one place.</p>
        </div>
      </section>
    </PageShell>
  )
}
