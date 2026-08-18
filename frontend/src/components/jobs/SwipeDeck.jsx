import React, { useState } from 'react'
import SwipeCard from './SwipeCard'

export default function SwipeDeck({ jobs, onSwiped, onEmpty }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleSwiped = (jobId, direction) => {
    onSwiped?.(jobId, direction)
    setCurrentIndex(prev => {
      const next = prev + 1
      if (next >= jobs.length) onEmpty?.()
      return next
    })
  }

  if (currentIndex >= jobs.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <p className="font-display text-3xl font-semibold text-ink">You're all caught up!</p>
        <p className="mt-2 text-slate max-w-xs">
          You've seen all available jobs. Check back later or adjust your filters.
        </p>
      </div>
    )
  }

  // Render top 3 cards in a stack (only top one is interactive)
  const visibleCards = jobs.slice(currentIndex, currentIndex + 3)

  return (
    <div className="relative w-full h-full">
      {visibleCards.map((job, stackIdx) => {
        const isTop = stackIdx === 0
        const scale = 1 - stackIdx * 0.04
        const translateY = stackIdx * 12
        return (
          <div
            key={job.id}
            className="absolute inset-0"
            style={{
              transform: `scale(${scale}) translateY(${translateY}px)`,
              zIndex: visibleCards.length - stackIdx,
              pointerEvents: isTop ? 'auto' : 'none',
            }}
          >
            <SwipeCard job={job} onSwiped={isTop ? handleSwiped : undefined} />
          </div>
        )
      })}
    </div>
  )
}
