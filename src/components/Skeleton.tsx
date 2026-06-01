// Tiny CSS-driven shimmer block. Used wherever the UI shape is known
// but the data isn't here yet — preferable to "Loading..." text because
// the layout doesn't reflow when real content lands.
//
// Pair with the `.skel` rule in v3.css (animated background gradient).

interface Props {
  width?: string | number
  height?: string | number
  radius?: number
  // For overrides like inline-block when the parent expects a row of
  // multiple skeletons on the same line.
  style?: React.CSSProperties
  className?: string
}

function toCss(v?: string | number): string | undefined {
  if (v === undefined) return undefined
  return typeof v === 'number' ? `${v}px` : v
}

export function Skeleton({ width, height = 12, radius = 6, style, className }: Props) {
  const merged: React.CSSProperties = {
    width: toCss(width) ?? '100%',
    height: toCss(height),
    borderRadius: radius,
    ...style,
  }
  return (
    <span
      aria-hidden="true"
      className={className ? `skel ${className}` : 'skel'}
      style={merged}
    />
  )
}
