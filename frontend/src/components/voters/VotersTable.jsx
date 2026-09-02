import { VOTERS_PAGE_SIZE } from "../../hooks/useVotersList"

export default function VotersTable({ voters, total, offset, setOffset, loading, openEdit }) {
  const hasNextPage = offset + VOTERS_PAGE_SIZE < total
  const hasPrevPage = offset > 0

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {loading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
          ))}
        </div>
      ) : voters.length === 0 ? (
        <p className="text-sm py-12 text-center" style={{ color: "var(--color-muted)" }}>
          No voters yet. Add one manually or import a CSV of your voter roll.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: "var(--color-muted)" }}>
                <th className="py-2.5 px-4 font-medium">Voter ID</th>
                <th className="py-2.5 px-4 font-medium">Full Name</th>
                <th className="py-2.5 px-4 font-medium">Address</th>
                <th className="py-2.5 px-4 font-medium">DL Number</th>
                <th className="py-2.5 px-4 font-medium">Signature</th>
                <th className="py-2.5 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {voters.map((v) => (
                <tr key={v.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                  <td className="py-3 px-4 font-mono-num" style={{ color: "var(--color-muted)" }}>
                    {v.external_voter_id || "—"}
                  </td>
                  <td className="py-3 px-4 font-medium">{v.full_name}</td>
                  <td className="py-3 px-4">{v.registered_address}</td>
                  <td className="py-3 px-4 font-mono-num">{v.dl_number || "—"}</td>
                  <td className="py-3 px-4">
                    {v.has_signature ? (
                      <span style={{ color: "var(--color-primary)" }}>On file</span>
                    ) : (
                      <span style={{ color: "var(--color-muted)" }}>None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openEdit(v)}
                      className="cursor-pointer text-xs font-medium underline"
                      style={{ color: "var(--color-accent)" }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > VOTERS_PAGE_SIZE && (
        <div
          className="flex items-center justify-between px-4 py-3 border-t text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
        >
          <span>
            Showing {offset + 1}–{Math.min(offset + VOTERS_PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={!hasPrevPage}
              onClick={() => setOffset((o) => Math.max(0, o - VOTERS_PAGE_SIZE))}
              className="cursor-pointer rounded-md px-3 py-1.5 border disabled:opacity-40"
              style={{ borderColor: "var(--color-border)" }}
            >
              Previous
            </button>
            <button
              disabled={!hasNextPage}
              onClick={() => setOffset((o) => o + VOTERS_PAGE_SIZE)}
              className="cursor-pointer rounded-md px-3 py-1.5 border disabled:opacity-40"
              style={{ borderColor: "var(--color-border)" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
