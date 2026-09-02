import { Link } from "react-router-dom"
import AppShell from "../components/AppShell"
import { useTenantConfig } from "../hooks/useTenantConfig"
import { useTenantDashboard } from "../hooks/useTenantDashboard"

const CARD_DEFS = [
  {
    key: "daily_incoming_requests",
    label: "Daily Incoming Requests",
    hint: "Absentee applications received in the last 24 hours",
    tone: "primary",
    icon: InboxIcon,
  },
  {
    key: "completed_ballots_received",
    label: "Completed Ballots Received",
    hint: "Returned ballots received, verified + pending",
    link: "/returned-ballots",
    tone: "success",
    icon: CheckCircleIcon,
  },
  {
    key: "current_queued_items",
    label: "Current Queued Items",
    hint: "Applications awaiting processing",
    link: "/applications",
    tone: "warning",
    icon: ClockIcon,
  },
  {
    key: "items_in_cure_process",
    label: "Items in Cure Process",
    hint: "Awaiting voter correction or resubmission",
    link: "/applications?view=processed&status=cure",
    tone: "info",
    icon: EditIcon,
  },
]

const TONE_COLORS = {
  primary: { fg: "var(--color-primary)", bg: "var(--color-muted-bg)" },
  success: { fg: "var(--color-success)", bg: "var(--color-success-bg)" },
  warning: { fg: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  info: { fg: "var(--color-info)", bg: "var(--color-info-bg)" },
}

const QUICK_ACTIONS = [
  { to: "/applications/new", label: "New Application", hint: "Intake an absentee application" },
  { to: "/returned-ballots/new", label: "Record Returned Ballot", hint: "Log a returned envelope" },
  { to: "/voters", label: "Manage Voters", hint: "Add, edit, or import the voter roll" },
]

export default function TenantDashboard() {
  const { tenant } = useTenantConfig()
  const { summary, loading, error, load } = useTenantDashboard()

  return (
    <AppShell role="tenant">
      <div
        className="border-b"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-primary)" }}>
              {tenant?.name || "Welcome back"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--color-foreground)" }}>
              Operational Dashboard
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--color-muted)" }}>
              Live processing volumes and outstanding workload, updated in real time.
            </p>
          </div>
          <Link
            to="/applications/new"
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            <PlusIcon />
            New Application
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg px-4 py-3 text-sm flex items-center justify-between"
            style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
          >
            <span>{error}</span>
            <button onClick={load} className="cursor-pointer underline font-medium">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {CARD_DEFS.map((card) => {
            const tone = TONE_COLORS[card.tone]
            const Icon = card.icon
            const value = summary?.[card.key]

            const cardBody = (
              <>
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}
                  >
                    <Icon />
                  </span>
                  {card.link && (
                    <span
                      className="text-xs font-medium opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      style={{ color: tone.fg }}
                    >
                      View →
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="h-9 w-16 rounded animate-pulse mb-2" style={{ backgroundColor: "var(--color-muted-bg)" }} />
                ) : (
                  <p className="text-3xl font-semibold font-mono-num leading-none mb-2" style={{ color: "var(--color-foreground)" }}>
                    {value ?? "—"}
                  </p>
                )}
                <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                  {card.label}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  {card.hint}
                </p>
              </>
            )

            const cardStyle = {
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
            }

            return card.link ? (
              <Link
                key={card.key}
                to={card.link}
                className="group rounded-2xl border p-5 block transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                style={cardStyle}
              >
                {cardBody}
              </Link>
            ) : (
              <div key={card.key} className="rounded-2xl border p-5" style={cardStyle}>
                {cardBody}
              </div>
            )
          })}
        </div>

        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-foreground)" }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="rounded-2xl border p-5 flex items-center justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    {action.label}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                    {action.hint}
                  </p>
                </div>
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
                >
                  <ArrowRightIcon />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function iconProps() {
  return { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true }
}

function InboxIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 11 3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
