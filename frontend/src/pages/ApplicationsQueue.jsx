import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import AppShell from "../components/AppShell"
import { api } from "../lib/api"

const PROCESSED_STATUSES = [
  { value: "", label: "All processed" },
  { value: "approved", label: "Approved (pending ABS)" },
  { value: "abs_sent", label: "ABS Sent" },
  { value: "rejected", label: "Rejected" },
  { value: "cure", label: "Cure" },
  { value: "reapproved", label: "Reapproved" },
]

const STATUS_LABELS = {
  unprocessed: "Unprocessed",
  approved: "Approved",
  abs_sent: "ABS Sent",
  rejected: "Rejected",
  cure: "Cure",
  reapproved: "Reapproved",
}

const STATUS_TONE = {
  unprocessed: { bg: "var(--color-muted-bg)", fg: "var(--color-muted)" },
  approved: { bg: "var(--color-info-bg)", fg: "var(--color-info)" },
  abs_sent: { bg: "var(--color-success-bg)", fg: "var(--color-success)" },
  rejected: { bg: "var(--color-destructive-bg)", fg: "var(--color-destructive)" },
  cure: { bg: "var(--color-warning-bg)", fg: "var(--color-warning)" },
  reapproved: { bg: "var(--color-info-bg)", fg: "var(--color-info)" },
}

export default function ApplicationsQueue() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get("view") === "processed" ? "processed" : "unprocessed"
  const status = searchParams.get("status") || ""
  const reapprovalOnly = searchParams.get("reapproval_only") === "true"

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    setLoading(true)
    setError("")
    const params = { view }
    if (view === "processed" && status) params.status = status
    if (reapprovalOnly) params.reapproval_only = true
    api
      .get("/applications", { params })
      .then((res) => setApplications(res.data))
      .catch(() => setError("Could not load applications."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [view, status, reapprovalOnly])

  const setView = (nextView) => {
    const params = { view: nextView }
    setSearchParams(params)
  }

  return (
    <AppShell role="tenant">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              Absentee Applications
            </h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Review and process incoming absentee ballot applications.
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

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <TabButton active={view === "unprocessed" && !reapprovalOnly} onClick={() => setView("unprocessed")}>
            Unprocessed Incoming
          </TabButton>
          <TabButton active={view === "processed"} onClick={() => setView("processed")}>
            Processed
          </TabButton>
          <TabButton
            active={reapprovalOnly}
            onClick={() => setSearchParams({ view: "unprocessed", reapproval_only: "true" })}
          >
            Reapproval Queue
          </TabButton>

          {view === "processed" && (
            <select
              value={status}
              onChange={(e) => setSearchParams({ view: "processed", status: e.target.value })}
              className="ml-auto rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              {PROCESSED_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
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

        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <p className="text-sm py-12 text-center" style={{ color: "var(--color-muted)" }}>
              No applications in this view.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: "var(--color-muted)" }}>
                    <th className="py-2.5 px-4 font-medium">Application #</th>
                    <th className="py-2.5 px-4 font-medium">Submitted Name</th>
                    <th className="py-2.5 px-4 font-medium">Matched Voter</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t cursor-pointer hover:opacity-80"
                      style={{ borderColor: "var(--color-border)" }}
                      onClick={() => navigate(`/applications/${a.id}`)}
                    >
                      <td className="py-3 px-4 font-mono-num">
                        <span className="underline" style={{ color: "var(--color-accent)" }}>
                          {a.application_number}
                        </span>
                        {a.is_reapproval && (
                          <span
                            className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
                          >
                            reapplied
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{a.submitted_full_name}</td>
                      <td className="py-3 px-4">
                        {a.voter_matched_name || <span style={{ color: "var(--color-muted)" }}>Unmatched</span>}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap" style={{ color: "var(--color-muted)" }}>
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150"
      style={
        active
          ? { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }
          : { backgroundColor: "var(--color-muted-bg)", color: "var(--color-muted)" }
      }
    >
      {children}
    </button>
  )
}

function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.unprocessed
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}
