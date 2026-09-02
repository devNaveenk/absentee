import AppShell from "../components/AppShell"
import CreateTenantModal from "../components/superadmin/CreateTenantModal"
import { StatCard } from "../components/superadmin/DashboardPrimitives"
import RecentRequestsTable from "../components/superadmin/RecentRequestsTable"
import TenantsTable from "../components/superadmin/TenantsTable"
import UsageSummaryTable from "../components/superadmin/UsageSummaryTable"
import { useSuperadminDashboard } from "../hooks/useSuperadminDashboard"

export default function SuperadminDashboard() {
  const d = useSuperadminDashboard()

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
            onClick={() => d.setShowCreate(true)}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            + New Tenant
          </button>
        </div>

        {d.error && (
          <div
            role="alert"
            className="mb-6 rounded-lg px-4 py-3 text-sm flex items-center justify-between"
            style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
          >
            <span>{d.error}</span>
            <button onClick={d.loadAll} className="cursor-pointer underline font-medium">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total tenants" value={d.tenants.length} loading={d.loading} />
          <StatCard label="Requests (24h)" value={d.totalRequests.toLocaleString()} loading={d.loading} />
          <StatCard
            label="Rate-limited (24h)"
            value={d.totalLimited.toLocaleString()}
            loading={d.loading}
            tone={d.totalLimited > 0 ? "warn" : "default"}
          />
        </div>

        <TenantsTable
          tenants={d.tenants}
          loading={d.loading}
          editingId={d.editingId}
          editValue={d.editValue}
          setEditValue={d.setEditValue}
          startEdit={d.startEdit}
          saveEdit={d.saveEdit}
          setEditingId={d.setEditingId}
          toggleStatus={d.toggleStatus}
        />

        <UsageSummaryTable summary={d.summary} loading={d.loading} />

        <RecentRequestsTable
          logs={d.logs}
          logsLoading={d.logsLoading}
          logsTotal={d.logsTotal}
          logsOffset={d.logsOffset}
          setLogsOffset={d.setLogsOffset}
        />
      </div>

      {d.showCreate && <CreateTenantModal onClose={() => d.setShowCreate(false)} onCreated={d.loadAll} />}
    </AppShell>
  )
}
