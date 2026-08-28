import { useEffect, useState } from "react"
import AppShell from "../components/AppShell"
import Modal from "../components/Modal"
import { api } from "../lib/api"

const LOGS_PAGE_SIZE = 50

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState([])
  const [summary, setSummary] = useState([])
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsOffset, setLogsOffset] = useState(0)
  const [logsLoading, setLogsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError("")
    try {
      const [tenantsRes, summaryRes] = await Promise.all([
        api.get("/superadmin/tenants"),
        api.get("/superadmin/usage-summary", { params: { hours: 24 } }),
      ])
      setTenants(tenantsRes.data)
      setSummary(summaryRes.data)
    } catch {
      setError("Could not load dashboard data. Please retry.")
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await api.get("/superadmin/usage-logs", {
        params: { offset: logsOffset, limit: LOGS_PAGE_SIZE },
      })
      setLogs(res.data.items)
      setLogsTotal(res.data.total)
    } catch {
      setError("Could not load usage logs. Please retry.")
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [logsOffset])

  const startEdit = (tenant) => {
    setEditingId(tenant.id)
    setEditValue(String(tenant.requests_per_minute ?? 120))
  }

  const saveEdit = async (tenantId) => {
    const value = Number(editValue)
    if (!Number.isFinite(value) || value <= 0) return
    await api.patch(`/superadmin/tenants/${tenantId}/rate-limit`, { requests_per_minute: value })
    setEditingId(null)
    loadAll()
  }

  const toggleStatus = async (tenant) => {
    await api.patch(`/superadmin/tenants/${tenant.id}/status`, null, {
      params: { is_active: !tenant.is_active },
    })
    loadAll()
  }

  const totalRequests = summary.reduce((sum, s) => sum + s.total_requests, 0)
  const totalLimited = summary.reduce((sum, s) => sum + s.rate_limited_requests, 0)

  return (
    <AppShell role="superadmin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              Platform Overview
            </h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Usage logs and rate limiting across all tenants, last 24 hours.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            + New Tenant
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg px-4 py-3 text-sm flex items-center justify-between"
            style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
          >
            <span>{error}</span>
            <button onClick={loadAll} className="cursor-pointer underline font-medium">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total tenants" value={tenants.length} loading={loading} />
          <StatCard label="Requests (24h)" value={totalRequests.toLocaleString()} loading={loading} />
          <StatCard
            label="Rate-limited (24h)"
            value={totalLimited.toLocaleString()}
            loading={loading}
            tone={totalLimited > 0 ? "warn" : "default"}
          />
        </div>

        <Section title="Tenants & Rate Limits">
          {loading ? (
            <SkeletonRows rows={3} />
          ) : tenants.length === 0 ? (
            <EmptyState message="No tenants yet. Create the first one to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: "var(--color-muted)" }}>
                    <th className="py-2 pr-4 font-medium">Tenant</th>
                    <th className="py-2 pr-4 font-medium">Slug</th>
                    <th className="py-2 pr-4 font-medium">Mode</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Rate limit (req/min)</th>
                    <th className="py-2 pr-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                      <td className="py-3 pr-4 font-medium">{t.name}</td>
                      <td className="py-3 pr-4 font-mono-num" style={{ color: "var(--color-muted)" }}>
                        {t.slug}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
                        >
                          {t.processing_mode}
                        </span>
                        {t.jurisdiction_state && (
                          <span className="ml-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
                            {t.jurisdiction_state}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge active={t.is_active} />
                      </td>
                      <td className="py-3 pr-4">
                        {editingId === t.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24 rounded-md border px-2 py-1 font-mono-num"
                              style={{ borderColor: "var(--color-border)" }}
                              autoFocus
                            />
                            <button
                              onClick={() => saveEdit(t.id)}
                              className="cursor-pointer text-xs font-medium px-2 py-1 rounded-md"
                              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="cursor-pointer text-xs font-medium px-2 py-1"
                              style={{ color: "var(--color-muted)" }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono-num">{t.requests_per_minute ?? "—"}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {editingId !== t.id && (
                            <button
                              onClick={() => startEdit(t)}
                              className="cursor-pointer text-xs font-medium underline"
                              style={{ color: "var(--color-accent)" }}
                            >
                              Edit limit
                            </button>
                          )}
                          <button
                            onClick={() => toggleStatus(t)}
                            className="cursor-pointer text-xs font-medium underline"
                            style={{ color: t.is_active ? "var(--color-destructive)" : "var(--color-primary)" }}
                          >
                            {t.is_active ? "Suspend" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Usage by Tenant (24h)">
          {loading ? (
            <SkeletonRows rows={2} />
          ) : summary.length === 0 ? (
            <EmptyState message="No API traffic recorded yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: "var(--color-muted)" }}>
                    <th className="py-2 pr-4 font-medium">Tenant</th>
                    <th className="py-2 pr-4 font-medium">Total requests</th>
                    <th className="py-2 pr-4 font-medium">Rate-limited</th>
                    <th className="py-2 pr-4 font-medium">Avg duration</th>
                    <th className="py-2 pr-4 font-medium">Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s) => (
                    <tr key={s.tenant_id ?? "none"} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                      <td className="py-3 pr-4 font-medium">{s.tenant_name || "Unknown"}</td>
                      <td className="py-3 pr-4 font-mono-num">{s.total_requests.toLocaleString()}</td>
                      <td className="py-3 pr-4 font-mono-num" style={{ color: s.rate_limited_requests > 0 ? "var(--color-destructive)" : "inherit" }}>
                        {s.rate_limited_requests.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 font-mono-num">{s.avg_duration_ms} ms</td>
                      <td className="py-3 pr-4 font-mono-num">{s.requests_per_minute_limit ?? "—"}/min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Recent Requests">
          {logsLoading ? (
            <SkeletonRows rows={4} />
          ) : logs.length === 0 ? (
            <EmptyState message="No requests logged yet." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: "var(--color-muted)" }}>
                      <th className="py-2 pr-4 font-medium">Time</th>
                      <th className="py-2 pr-4 font-medium">Method</th>
                      <th className="py-2 pr-4 font-medium">Path</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                        <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "var(--color-muted)" }}>
                          {new Date(log.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 pr-4 font-mono-num">{log.method}</td>
                        <td className="py-2.5 pr-4 truncate max-w-xs">{log.path}</td>
                        <td className="py-2.5 pr-4">
                          <span
                            className="font-mono-num"
                            style={{ color: log.status_code >= 400 ? "var(--color-destructive)" : "var(--color-primary)" }}
                          >
                            {log.status_code}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono-num">{log.duration_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {logsTotal > LOGS_PAGE_SIZE && (
                <div
                  className="flex items-center justify-between pt-4 mt-2 border-t text-sm"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                >
                  <span>
                    Showing {logsOffset + 1}–{Math.min(logsOffset + LOGS_PAGE_SIZE, logsTotal)} of {logsTotal.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={logsOffset === 0}
                      onClick={() => setLogsOffset((o) => Math.max(0, o - LOGS_PAGE_SIZE))}
                      className="cursor-pointer rounded-md px-3 py-1.5 border disabled:opacity-40"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      Previous
                    </button>
                    <button
                      disabled={logsOffset + LOGS_PAGE_SIZE >= logsTotal}
                      onClick={() => setLogsOffset((o) => o + LOGS_PAGE_SIZE)}
                      className="cursor-pointer rounded-md px-3 py-1.5 border disabled:opacity-40"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Section>
      </div>

      {showCreate && <CreateTenantModal onClose={() => setShowCreate(false)} onCreated={loadAll} />}
    </AppShell>
  )
}

function StatCard({ label, value, loading, tone = "default" }) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <p className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>
        {label}
      </p>
      {loading ? (
        <div className="h-8 w-20 rounded animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
      ) : (
        <p
          className="text-2xl font-semibold font-mono-num"
          style={{ color: tone === "warn" && value !== "0" ? "var(--color-destructive)" : "var(--color-foreground)" }}
        >
          {value}
        </p>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>
        {title}
      </h2>
      <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        {children}
      </div>
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={
        active
          ? { backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }
          : { backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: active ? "var(--color-success)" : "var(--color-destructive)" }}
      />
      {active ? "Active" : "Suspended"}
    </span>
  )
}

function SkeletonRows({ rows }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
      ))}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <p className="text-sm py-6 text-center" style={{ color: "var(--color-muted)" }}>
      {message}
    </p>
  )
}

const VERIFICATION_METHOD_OPTIONS = [
  { value: "full_name", label: "Full name" },
  { value: "address", label: "Registered address" },
  { value: "dl_number", label: "Driver's License number" },
  { value: "signature", label: "Visual signature comparison" },
  { value: "veteran_id", label: "Veteran ID" },
  { value: "passport_id", label: "Passport ID" },
]

const GA_DEFAULT_METHODS = ["full_name", "address", "dl_number"]
const OTHER_DEFAULT_METHODS = ["full_name", "address", "signature"]

function CreateTenantModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    admin_email: "",
    admin_password: "",
    requests_per_minute: 120,
    processing_mode: "manual",
    jurisdiction_state: "",
    cure_notification_method: "email",
  })
  const [verificationMethods, setVerificationMethods] = useState(OTHER_DEFAULT_METHODS)
  const [methodsTouched, setMethodsTouched] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    if (field === "jurisdiction_state" && !methodsTouched) {
      setVerificationMethods(value.toUpperCase() === "GA" ? GA_DEFAULT_METHODS : OTHER_DEFAULT_METHODS)
    }
  }

  const toggleMethod = (method) => {
    setMethodsTouched(true)
    setVerificationMethods((methods) =>
      methods.includes(method) ? methods.filter((m) => m !== method) : [...methods, method]
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await api.post("/superadmin/tenants", {
        ...form,
        requests_per_minute: Number(form.requests_per_minute) || 120,
        jurisdiction_state: form.jurisdiction_state ? form.jurisdiction_state.toUpperCase() : null,
        verification_methods: verificationMethods,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create tenant.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Create Tenant" onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
              {error}
            </div>
          )}
          <Field label="Organization name" value={form.name} onChange={update("name")} required />
          <Field label="Slug" value={form.slug} onChange={update("slug")} required placeholder="acme-county" />
          <Field label="Admin email" type="email" value={form.admin_email} onChange={update("admin_email")} required />
          <Field label="Admin password" type="password" value={form.admin_password} onChange={update("admin_password")} required />
          <Field
            label="Rate limit (req/min)"
            type="number"
            value={form.requests_per_minute}
            onChange={update("requests_per_minute")}
          />

          <div>
            <label htmlFor="processing-mode" className="block text-sm font-medium mb-1.5">
              Processing mode
            </label>
            <select
              id="processing-mode"
              value={form.processing_mode}
              onChange={update("processing_mode")}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)" }}
            >
              <option value="manual">Manual Mode (clerk data entry)</option>
              <option value="scan">Scan Mode (OCR / Document AI)</option>
            </select>
          </div>

          <Field
            label="Jurisdiction state (2-letter, optional)"
            value={form.jurisdiction_state}
            onChange={update("jurisdiction_state")}
            placeholder="GA"
            maxLength={2}
          />

          <div>
            <label htmlFor="cure-notify" className="block text-sm font-medium mb-1.5">
              Cure notification method
            </label>
            <select
              id="cure-notify"
              value={form.cure_notification_method}
              onChange={update("cure_notification_method")}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)" }}
            >
              <option value="email">Email</option>
              <option value="mail">Physical mail</option>
              <option value="both">Email + physical mail</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Verification checklist</label>
            <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>
              Defaults to GA's Full Name + Address + DL Number, or Full Name + Address + Signature otherwise. Adjust
              as needed for this jurisdiction.
            </p>
            <div className="space-y-1.5">
              {VERIFICATION_METHOD_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationMethods.includes(opt.value)}
                    onChange={() => toggleMethod(opt.value)}
                    className="h-4 w-4 cursor-pointer"
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2 text-sm font-medium" style={{ color: "var(--color-muted)" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              {submitting ? "Creating…" : "Create tenant"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

function Field({ label, ...props }) {
  const id = `field-${label.replace(/\s+/g, "-").toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--color-border)" }}
      />
    </div>
  )
}
