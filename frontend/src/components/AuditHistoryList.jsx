/** Shared audit-trail list -- same event shape (action/reason/created_at) on
 *  both AbsenteeApplication and ReturnedBallot events, so both detail pages
 *  render it identically instead of duplicating the markup. */
export default function AuditHistoryList({ events }) {
  return (
    <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-base font-semibold mb-4">Audit History</h2>
      <ol className="space-y-2 text-sm">
        {events.map((e) => (
          <li key={e.id} className="flex items-center justify-between border-t first:border-t-0 pt-2 first:pt-0" style={{ borderColor: "var(--color-border)" }}>
            <span>
              <span className="font-medium capitalize">{e.action.replaceAll("_", " ")}</span>
              {e.reason && <span style={{ color: "var(--color-muted)" }}> — {e.reason.replaceAll("_", " ")}</span>}
            </span>
            <span style={{ color: "var(--color-muted)" }}>{new Date(e.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
