'use client'

import { useConnectionQualityIndicator } from '@livekit/components-react'
import { ConnectionQuality } from 'livekit-client'

const qualityConfig: Record<string, { label: string; color: string; bars: number }> = {
  [ConnectionQuality.Excellent]: { label: 'Excellent', color: '#10b981', bars: 4 },
  [ConnectionQuality.Good]: { label: 'Good', color: '#10b981', bars: 3 },
  [ConnectionQuality.Poor]: { label: 'Poor', color: '#f59e0b', bars: 2 },
  [ConnectionQuality.Lost]: { label: 'Reconnecting', color: '#ef4444', bars: 1 },
  [ConnectionQuality.Unknown]: { label: 'Connecting', color: '#94a3b8', bars: 0 },
}

export default function NetworkQuality() {
  let quality: ConnectionQuality

  try {
    const indicator = useConnectionQualityIndicator()
    quality = indicator.quality
  } catch {
    return null
  }

  const config = qualityConfig[quality] || qualityConfig[ConnectionQuality.Unknown]

  return (
    <div
      className="network-quality"
      title={`Connection: ${config.label}`}
      aria-label={`Network quality: ${config.label}`}
      role="status"
    >
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className="network-bar"
          style={{
            height: `${bar * 3 + 4}px`,
            background: bar <= config.bars ? config.color : 'var(--border)',
          }}
        />
      ))}
    </div>
  )
}
