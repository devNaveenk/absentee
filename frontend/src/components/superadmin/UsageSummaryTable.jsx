import { EmptyState, Section, SkeletonRows } from "./DashboardPrimitives"

export default function UsageSummaryTable({ summary, loading }) {
  return (
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
  )
}
