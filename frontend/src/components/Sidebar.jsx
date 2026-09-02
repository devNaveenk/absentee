import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"

const SIDEBAR_COLLAPSED_KEY = "ballotda_sidebar_collapsed"

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/applications", label: "Applications", icon: ApplicationsIcon, end: true },
  { to: "/returned-ballots", label: "Returned Ballots", icon: BallotsIcon },
  { to: "/voters", label: "Voters", icon: VotersIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon, adminOnly: true },
]

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"
  } catch {
    return false
  }
}

export default function Sidebar({ role, mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "tenant_admin")

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
    } catch {
      // ignore -- localStorage may be unavailable (private mode, etc.)
    }
  }, [collapsed])

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
      isActive ? "" : "hover:opacity-80"
    }`
  const linkStyle = ({ isActive }) =>
    isActive
      ? { backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }
      : { color: "var(--color-muted)" }

  const content = (collapsedMode) => (
    <>
      <nav className="flex-1 flex flex-col gap-1 p-3" aria-label="Primary">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsedMode ? label : undefined}
            className={linkClass}
            style={linkStyle}
            onClick={onMobileClose}
          >
            <Icon className="shrink-0" />
            {!collapsedMode && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="cursor-pointer hidden md:flex items-center gap-3 mx-3 mb-3 rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors duration-150 hover:opacity-80"
        style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
        aria-label={collapsedMode ? "Expand sidebar" : "Collapse sidebar"}
      >
        <CollapseIcon collapsed={collapsedMode} />
        {!collapsedMode && <span>Collapse</span>}
      </button>
    </>
  )

  return (
    <>
      {/* Desktop: permanent column */}
      <aside
        className="hidden md:flex flex-col shrink-0 border-r transition-all duration-150"
        style={{ width: collapsed ? 72 : 240, borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
      >
        {content(collapsed)}
      </aside>

      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onMobileClose} />
          <aside
            className="absolute inset-y-0 left-0 w-64 flex flex-col border-r"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            {content(false)}
          </aside>
        </div>
      )}
    </>
  )
}

function iconProps(className) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className,
  }
}

function DashboardIcon({ className }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function ApplicationsIcon({ className }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M4 4h16v11H4z" />
      <path d="M4 15l4 5h8l4-5" />
    </svg>
  )
}

function BallotsIcon({ className }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  )
}

function VotersIcon({ className }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M15.5 14.2c2.4.5 4.5 2.7 4.5 5.8" />
    </svg>
  )
}

function SettingsIcon({ className }) {
  return (
    <svg {...iconProps(className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}

function CollapseIcon({ collapsed }) {
  return (
    <svg {...iconProps()} style={{ transform: collapsed ? "rotate(180deg)" : undefined }}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}
