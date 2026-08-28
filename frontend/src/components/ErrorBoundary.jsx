import { Component } from "react"
import Logo from "./Logo"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info)
  }

  handleReload = () => {
    window.location.href = "/dashboard"
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        className="min-h-dvh flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <Logo size={40} />
          </div>
          <div
            className="rounded-2xl border shadow-sm p-8"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full mb-5"
              style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
              Something went wrong
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
              An unexpected error occurred while rendering this page. This has been logged — try reloading, and if
              the problem continues, contact your administrator.
            </p>
            <button
              onClick={this.handleReload}
              className="cursor-pointer w-full rounded-lg py-2.5 text-base font-medium"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}
