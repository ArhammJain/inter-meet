'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="page-center">
          <div className="card" style={{ maxWidth: 400, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--danger)' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
