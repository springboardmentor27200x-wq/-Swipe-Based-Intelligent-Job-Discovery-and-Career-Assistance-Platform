import React from 'react'

export default function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  autoComplete,
  as = 'input',
  options,
}) {
  const baseClasses =
    'w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink placeholder:text-slate/60 transition focus:outline-none focus:ring-2 focus:ring-coral/40'
  const borderClasses = error ? 'border-coral' : 'border-sand focus:border-coral'

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink/80">
        {label} {required && <span className="text-coral">*</span>}
      </label>

      {as === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`${baseClasses} ${borderClasses}`}
          required={required}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${baseClasses} ${borderClasses}`}
          required={required}
        />
      )}

      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  )
}
