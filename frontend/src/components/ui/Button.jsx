import React from 'react'

const variants = {
  primary: 'bg-ink text-paper hover:bg-ink/90',
  coral: 'bg-coral text-white hover:bg-coral/90',
  outline: 'border border-ink/15 text-ink hover:bg-sand/60',
  ghost: 'text-ink hover:bg-sand/60',
}

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  full = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant]
      } ${full ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  )
}
