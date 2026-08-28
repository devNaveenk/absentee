export const METHOD_LABELS = {
  full_name: "Full name matches",
  address: "Registered address matches",
  dl_number: "Driver's License number matches",
  signature: "Signature visually compared and matches",
  veteran_id: "Veteran ID matches",
  passport_id: "Passport ID matches",
}

export default function VerificationChecklist({ methods, checklist, onChange }) {
  if (!methods || methods.length === 0) return null

  return (
    <section
      className="rounded-xl border p-5 mb-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h2 className="text-base font-semibold mb-1">Verification Checklist</h2>
      <p className="text-xs mb-4" style={{ color: "var(--color-muted)" }}>
        Configured for this jurisdiction. Confirm each item before approving or granting final approval.
      </p>
      <div className="space-y-2.5">
        {methods.map((method) => (
          <label key={method} className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!checklist[method]}
              onChange={(e) => onChange(method, e.target.checked)}
              className="h-4 w-4 cursor-pointer"
              style={{ accentColor: "var(--color-primary)" }}
            />
            {METHOD_LABELS[method] || method}
          </label>
        ))}
      </div>
    </section>
  )
}
