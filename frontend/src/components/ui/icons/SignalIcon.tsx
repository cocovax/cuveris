import { type SVGProps } from 'react'

export function SignalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 18a10 10 0 0 1 20 0" />
      <path d="M6 18a6 6 0 0 1 12 0" />
      <path d="M10 18a2 2 0 0 1 4 0" />
      <circle cx="12" cy="21" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

