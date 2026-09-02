import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useAuthedObjectUrl } from "../hooks/useAuthedObjectUrl"
import { useTenantConfig } from "../hooks/useTenantConfig"
import Logo from "./Logo"
import PageTransition from "./PageTransition"
import Sidebar from "./Sidebar"

export default function AppShell({ children, role }) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const { tenant } = useTenantConfig()
  const logoUrl = useAuthedObjectUrl(tenant?.has_logo ? "/tenant/settings/branding/logo" : null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--color-background)" }}>
      <header
        className="border-b sticky top-0 z-20"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            {role !== "superadmin" && (
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
                className="cursor-pointer md:hidden -ml-1 p-2 rounded-lg"
                style={{ color: "var(--color-foreground)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <Logo size={40} src={logoUrl} alt={tenant?.display_name || tenant?.name || "BallotDA"} />
            {role === "superadmin" && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
              >
                Superadmin
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-sm hidden lg:block" style={{ color: "var(--color-muted)" }}>
              {session?.email}
            </span>
            <button
              onClick={handleLogout}
              className="cursor-pointer text-sm font-medium rounded-lg px-3 py-2 transition-colors duration-150"
              style={{ color: "var(--color-foreground)", border: "1px solid var(--color-border)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {role !== "superadmin" && (
          <Sidebar role={session?.role} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        )}
        <main className="flex-1 min-w-0">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
