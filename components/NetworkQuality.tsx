'use client'

import { useConnectionQualityIndicator, useLocalParticipant } from '@livekit/components-react'
import { ConnectionQuality } from 'livekit-client'
import { Component, type ReactNode } from 'react'

const qualityConfig: Record<string, { label: string; color: string; bars: number }> = {
  [ConnectionQuality.Excellent]: { label: 'Excellent', color: '#00c875', bars: 4 },
  [ConnectionQuality.Good]: { label: 'Good', color: '#00c875', bars: 3 },
  [ConnectionQuality.Poor]: { label: 'Poor', color: '#fdab3d', bars: 2 },
  [ConnectionQuality.Lost]: { label: 'Reconnecting', color: '#e2445c', bars: 1 },
  [ConnectionQuality.Unknown]: { label: 'Connecting', color: '#909090', bars: 0 },
}

// Error boundary to safely catch if the hook context is unavailable
class NetworkQualityBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? null : this.props.children }
}

const NetworkQualityInner = () => {
  const { localParticipant } = useLocalParticipant()
  const { quality } = useConnectionQualityIndicator({ participant: localParticipant })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = qualityConfig[quality] || qualityConfig[ConnectionQuality.Unknown as any] || qualityConfig[ConnectionQuality.Unknown]

  return (
    <div
      className="flex items-end gap-0.5 h-4"
      title={`Connection: ${config.label}`}
      aria-label={`Network quality: ${config.label}`}
      role="status"
    >
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className="w-1 rounded-sm transition-all duration-300"
          style={{
            height: `${bar * 3 + 2}px`,
            backgroundColor: bar <= config.bars ? config.color : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  )
}

export default function NetworkQuality() {
  return (
    <NetworkQualityBoundary>
      <NetworkQualityInner />
    </NetworkQualityBoundary>
  )
}

