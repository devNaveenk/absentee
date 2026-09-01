import { createContext, useCallback, useContext, useRef, useState } from "react"

const NotificationContext = createContext(null)

const TONE = {
  success: { fg: "var(--color-success)", bg: "var(--color-success-bg)" },
  error: { fg: "var(--color-destructive)", bg: "var(--color-destructive-bg)" },
  warning: { fg: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  info: { fg: "var(--color-info)", bg: "var(--color-info-bg)" },
}

const ICONS = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
}

const AUTO_DISMISS_MS = 4500

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message, type = "info") => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, message, type }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      return id
    },
    [dismiss]
  )

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotify must be used within a NotificationProvider")
  return ctx
}

function Toast({ toast, onDismiss }) {
  const tone = TONE[toast.type] || TONE.info
  const Icon = ICONS[toast.type] || InfoIcon
  return (
    <div
      className="toast-enter rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <span className="shrink-0 mt-0.5" style={{ color: tone.fg }}>
        <Icon />
      </span>
      <p className="text-sm flex-1" style={{ color: "var(--color-foreground)" }}>
        {toast.message}
      </p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="cursor-pointer shrink-0 rounded-md p-0.5 -m-0.5"
        style={{ color: "var(--color-muted)" }}
      >
        <CloseIcon />
      </button>
    </div>
  )
}

function SuccessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function  CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
