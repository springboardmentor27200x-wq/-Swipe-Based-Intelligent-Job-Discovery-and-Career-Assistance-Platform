import { motion } from 'framer-motion';
import clsx from 'clsx';

const variants = {
  primary: 'bg-gradient-button text-white shadow-glow-purple hover:shadow-[0_6px_20px_rgba(79,70,229,0.32)]',
  secondary: 'bg-white border border-slate-200 text-text-primary hover:bg-slate-50 hover:border-slate-300',
  danger: 'bg-gradient-danger text-white shadow-glow-red',
  success: 'bg-gradient-success text-white shadow-glow-green',
  gold: 'bg-gradient-gold text-white shadow-glow-gold',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-slate-100',
  outline: 'border border-primary/40 text-primary hover:bg-primary/5',
};

const sizes = {
  xs: 'px-3 py-1.5 text-xs rounded-lg',
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-base rounded-2xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  icon,
  iconRight,
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'font-inter select-none overflow-hidden',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {/* Shimmer effect */}
      {variant === 'primary' && (
        <span
          className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none"
          style={{ borderRadius: 'inherit' }}
        >
          <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </span>
      )}

      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading…</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </>
      )}
    </motion.button>
  );
}
