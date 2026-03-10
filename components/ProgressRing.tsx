'use client'
// components/ProgressRing.tsx — SVG doiraviy progress ko'rsatkich

interface ProgressRingProps {
  rate: number       // 0-100
  size?: number      // px (default: 88)
  strokeWidth?: number // px (default: 7)
}

export function ProgressRing({ rate, size = 88, strokeWidth = 7 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (rate / 100) * circumference

  function getColor(r: number): string {
    if (r >= 80) return '#16A34A'
    if (r >= 60) return '#FBBF24'
    if (r >= 40) return '#F97316'
    return '#EF4444'
  }

  const color = getColor(rate)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Orqa doira */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress doira */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s',
          }}
        />
      </svg>
      {/* Markazda foiz */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <span
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: size > 70 ? '1.25rem' : '0.9rem',
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1,
          }}
        >
          {Math.round(rate)}%
        </span>
      </div>
    </div>
  )
}
