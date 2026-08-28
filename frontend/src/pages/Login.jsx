import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Logo from "../components/Logo"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const [mode, setMode] = useState("tenant")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [tenantSlug, setTenantSlug] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const session = await login({
        email,
        password,
        tenantSlug: mode === "tenant" ? tenantSlug : null,
      })
      navigate(session.role === "superadmin" ? "/superadmin" : "/dashboard")
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(detail || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size={40} />
        </div>

        <div
          className="rounded-2xl border shadow-sm p-8"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div
            role="tablist"
            aria-label="Login type"
            className="grid grid-cols-2 gap-1 p-1 rounded-lg mb-6"
            style={{ backgroundColor: "var(--color-muted-bg)" }}
          >
            {[
              { key: "tenant", label: "Tenant Login" },
              { key: "superadmin", label: "Superadmin" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => setMode(tab.key)}
                className="cursor-pointer rounded-md py-2 text-sm font-medium transition-colors duration-200"
                style={
                  mode === tab.key
                    ? { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }
                    : { color: "var(--color-muted)" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
            {mode === "tenant" ? "Sign in to your workspace" : "Superadmin sign in"}
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            {mode === "tenant"
              ? "Enter your organization slug and account credentials."
              : "Platform-level access for usage monitoring and rate limits."}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
              >
                {error}
              </div>
            )}

            {mode === "tenant" && (
              <div className="mb-4">
                <label htmlFor="tenantSlug" className="block text-sm font-medium mb-1.5">
                  Organization slug
                </label>
                <input
                  id="tenantSlug"
                  type="text"
                  required
                  autoComplete="organization"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="acme-county"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-base outline-none transition-colors duration-150"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                />
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border px-3.5 py-2.5 text-base outline-none transition-colors duration-150"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border px-3.5 py-2.5 pr-12 text-base outline-none transition-colors duration-150"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="cursor-pointer absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-md"
                  style={{ color: "var(--color-muted)" }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer w-full rounded-lg py-2.5 text-base font-medium transition-opacity duration-150 disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--color-muted)" }}>
          Secure access to BallotDA. Contact your administrator if you need an account.
        </p>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.7 19.7 0 0 1 4.22-5.36M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a19.86 19.86 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
