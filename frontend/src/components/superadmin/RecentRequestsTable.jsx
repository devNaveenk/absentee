import { EmptyState, Section, SkeletonRows } from "./DashboardPrimitives"
import { LOGS_PAGE_SIZE } from "../../hooks/useSuperadminDashboard"

export default function RecentRequestsTable({ logs, logsLoading, logsTotal, logsOffset, setLogsOffset }) {
  return (
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
  )
}
