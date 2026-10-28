/** Infinite horizontal ticker (pure CSS, pauses on hover). */
export function Marquee({
  items,
  className,
  separator = "✦",
}: {
  items: string[]
  className?: string
  separator?: string
}) {
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-10 whitespace-nowrap">
          {item}
          <span aria-hidden className="text-tan-400">
            {separator}
          </span>
        </span>
      ))}
    </div>
  )
  return (
    <div className={`group relative flex overflow-hidden mask-fade-x ${className ?? ""}`}>
      <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
        {row}
        <div aria-hidden className="flex">
          {row}
        </div>
      </div>
    </div>
  )
}
