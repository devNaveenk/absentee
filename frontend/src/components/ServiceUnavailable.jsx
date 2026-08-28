import Logo from "./Logo"

export default function ServiceUnavailable({ onRetry }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-12"
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
            style={{ backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
              <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
            We'll be right back
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            BallotDA can't reach the server right now. This is usually temporary — please try again in a moment.
            If this continues, contact your administrator.
          </p>
          <button
            onClick={onRetry}
            className="cursor-pointer w-full rounded-lg py-2.5 text-base font-medium"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}
