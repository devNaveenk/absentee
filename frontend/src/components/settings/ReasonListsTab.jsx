const REASON_LIST_FIELDS = [
  { key: "application_rejection_reasons", label: "Application Rejection Reasons" },
  { key: "application_cure_reasons", label: "Application Cure Reasons" },
  { key: "ballot_rejection_reasons", label: "Returned Ballot Rejection Reasons" },
  { key: "received_via_options", label: "Received Via Options" },
]

export default function ReasonListsTab({
  reasonLists,
  savingReasons,
  addReasonItem,
  updateReasonItem,
  removeReasonItem,
  saveReasonLists,
}) {
  return (
    <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-base font-semibold mb-4">Reason Lists</h2>
      <div className="space-y-5">
        {REASON_LIST_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{label}</label>
              <button
                type="button"
                onClick={() => addReasonItem(key)}
                className="cursor-pointer text-xs font-medium underline"
                style={{ color: "var(--color-accent)" }}
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {(reasonLists[key] || []).map((value, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={value}
                    onChange={(e) => updateReasonItem(key, idx, e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeReasonItem(key, idx)}
                    className="cursor-pointer text-xs font-medium"
                    style={{ color: "var(--color-destructive)" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {(reasonLists[key] || []).length === 0 && (
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>No options yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={saveReasonLists}
        disabled={savingReasons}
        className="cursor-pointer mt-5 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
      >
        {savingReasons ? "Saving…" : "Save reason lists"}
      </button>
    </section>
  )
}
