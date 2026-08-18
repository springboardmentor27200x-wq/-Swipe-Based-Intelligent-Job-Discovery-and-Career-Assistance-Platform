import React from 'react'
import Navbar from './Navbar'

export default function PageShell({ children, narrow = false }) {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className={`mx-auto px-6 py-12 ${narrow ? 'max-w-xl' : 'max-w-6xl'}`}>{children}</main>
    </div>
  )
}
