import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AppShell from "../components/AppShell"
import { api } from "../lib/api"

export default function TenantDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    setLoading(true)
    setError("")
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load dashboard metrics."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const cards = [
    {
      label: "Daily Incoming Requests",
      value: summary?.daily_incoming_requests,
      hint: "Absentee applications received in the last 24 hours",
    },
    {
      label: "Completed Ballots Received",
      value: summary?.completed_ballots_received,
      hint: "Returned ballots received, verified + pending",
      link: "/returned-ballots",
    },
    {
      label: "Current Queued Items",
      value: summary?.current_queued_items,
      hint: "Applications awaiting processing",
      link: "/applications",
    },
    {
      label: "Items in Cure Process",
      value: summary?.items_in_cure_process,
      hint: "Awaiting voter correction or resubmission",
      link: "/applications?view=processed&status=cure",
    },
  ]

  return (
    <AppShell role="tenant">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              Operational Dashboard
            </h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Live processing volumes and outstanding workload.
            </p>
          </div>
          <Link
            to="/applications/new"
            className="rounded-lg px-4 py-2.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            + New Application
          </Link>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => {
            const cardStyle = { backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }
            const content = (
              <>
                <p className="text-sm font-medium mb-2" style={{ color: "var(--color-muted)" }}>
                  {card.label}
                </p>
                {loading ? (
                  <div className="h-10 w-16 rounded animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
                ) : (
                  <p className="text-4xl font-semibold font-mono-num" style={{ color: "var(--color-foreground)" }}>
                    {card.value ?? "—"}
                  </p>
                )}
                <p className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
                  {card.hint}
                </p>
              </>
            )
            return card.link ? (
              <Link key={card.label} to={card.link} className="rounded-xl border p-6 block" style={cardStyle}>
                {content}
              </Link>
            ) : (
              <div key={card.label} className="rounded-xl border p-6" style={cardStyle}>
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
