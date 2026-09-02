import { EmptyState, Section, SkeletonRows, StatusBadge } from "./DashboardPrimitives"

export default function TenantsTable({ tenants, loading, editingId, editValue, setEditValue, startEdit, saveEdit, setEditingId, toggleStatus }) {
  return (
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
  )
}
