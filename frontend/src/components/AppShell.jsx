import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Logo from "./Logo"

const TENANT_NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/applications", label: "Applications" },
  { to: "/returned-ballots", label: "Returned Ballots" },
]

export default function AppShell({ children, role }) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: "var(--color-background)" }}>
      <header
        className="border-b sticky top-0 z-10"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Logo size={26} />
            {role === "superadmin" && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
              >
                Superadmin
              </span>
            )}
          </div>

          {role !== "superadmin" && (
            <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
              {TENANT_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/applications"}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                      isActive ? "" : "hover:opacity-80"
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }
                      : { color: "var(--color-muted)" }
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

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
        {role !== "superadmin" && (
          <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto" aria-label="Primary">
            {TENANT_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/applications"}
                className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap"
                style={({ isActive }) =>
                  isActive
                    ? { backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }
                    : { color: "var(--color-muted)" }
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  )
}
