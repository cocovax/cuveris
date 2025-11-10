interface IconProps {
  className?: string
}

const base = 'h-4 w-4'

export function SnowflakeIcon({ className }: IconProps) {
  return (
    <svg
      className={`${base} ${className ?? ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20" />
      <path d="m5 7 14 10" />
      <path d="m5 17 14-10" />
      <path d="M5 12h14" />
    </svg>
  )
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg
      className={`${base} ${className ?? ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4 4.2 19.8M19.8 4.2l-1.4 1.4" />
    </svg>
  )
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg
      className={`${base} ${className ?? ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
    </svg>
  )
}

export function StopIcon({ className }: IconProps) {
  return (
    <svg
      className={`${base} ${className ?? ''}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  )
}

export function AlertTriangleIcon({ className }: IconProps) {
  return (
    <svg
      className={`${base} ${className ?? ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

