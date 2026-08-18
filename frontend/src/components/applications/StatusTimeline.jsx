import React from 'react'
import { PIPELINE_ORDER, STATUS_LABELS, STATUS_DOT, isTerminal } from '../../constants/applicationStatus'

/**
 * Visual pipeline timeline for a single application.
 * - Normal flow shows the 7-stage pipeline with completed/current/upcoming states.
 * - Terminal "rejected"/"withdrawn" statuses are shown as a distinct end state.
 */
export default function StatusTimeline({ status, statusHistory = [] }) {
  const terminal = isTerminal(status) && status !== 'accepted'
  const currentIndex = PIPELINE_ORDER.indexOf(status)

  const historyByStatus = {}
  for (const entry of statusHistory) {
    historyByStatus[entry.status] = entry.changed_at
  }

  const formatDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div>
      <div className="relative flex items-start justify-between">
        {PIPELINE_ORDER.map((stage, i) => {
          const reached = currentIndex >= 0 && i <= currentIndex && !terminal
          const isCurrent = i === currentIndex && !terminal
          return (
            <div key={stage} className="flex-1 relative flex flex-col items-center text-center px-1">
              {i > 0 && (
                <div
                  className={`absolute top-2 right-1/2 h-0.5 w-full -z-10 ${
                    reached && i <= currentIndex ? 'bg-teal' : 'bg-sand'
                  }`}
                />
              )}
              <div
                className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                  reached
                    ? `${STATUS_DOT[stage]} border-transparent`
                    : 'bg-white border-sand'
                } ${isCurrent ? 'ring-4 ring-teal/20' : ''}`}
              />
              <p className={`mt-2 text-[11px] leading-tight ${reached ? 'text-ink font-medium' : 'text-slate/60'}`}>
                {STATUS_LABELS[stage]}
              </p>
              {historyByStatus[stage] && (
                <p className="text-[10px] text-slate/50 mt-0.5">{formatDate(historyByStatus[stage])}</p>
              )}
            </div>
          )
        })}
      </div>

      {terminal && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-coral/5 border border-coral/20 px-3 py-2">
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
          <p className="text-xs text-coral font-medium">
            {STATUS_LABELS[status]}
            {historyByStatus[status] && ` · ${formatDate(historyByStatus[status])}`}
          </p>
        </div>
      )}
    </div>
  )
}
