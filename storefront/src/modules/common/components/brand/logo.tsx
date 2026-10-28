import { MARK, TAGLINE_BN, WORDMARK } from "./logo-paths"

type Props = { className?: string; title?: string }

export function LogoMark({ className, title = "Tantush" }: Props) {
  return (
    <svg viewBox={MARK.viewBox} className={className} fill="currentColor" role="img" aria-label={title}>
      <path fillRule="evenodd" d={MARK.d} />
    </svg>
  )
}

export function Wordmark({ className, title = "Tantush" }: Props) {
  return (
    <svg viewBox={WORDMARK.viewBox} className={className} fill="currentColor" role="img" aria-label={title}>
      <path fillRule="evenodd" d={WORDMARK.d} />
    </svg>
  )
}

export function TaglineBn({ className }: Props) {
  return (
    <svg
      viewBox={TAGLINE_BN.viewBox}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="সুতোয় গল্প, বুননে ঐতিহ্য"
    >
      <path fillRule="evenodd" d={TAGLINE_BN.d} />
    </svg>
  )
}

/** Horizontal lockup used in the header. */
export function LogoLockup({ className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark className="h-8 w-auto" />
      <Wordmark className="h-[13px] w-auto" />
    </span>
  )
}
