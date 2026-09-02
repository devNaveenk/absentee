import DetailRow from "../DetailRow"

export default function EnvelopeCard({ ballot, envelopeImageUrl }) {
  return (
    <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-base font-semibold mb-4">Outer Envelope / Flap</h2>
      <dl className="space-y-3 text-sm">
        <DetailRow label="Full name (as written)" value={ballot.submitted_full_name} />
        <DetailRow label="Address (as written)" value={ballot.submitted_address} />
      </dl>

      {ballot.has_envelope_scan && (
        <div className="mt-4">
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
            Scanned envelope image
          </p>
          {envelopeImageUrl ? (
            <img src={envelopeImageUrl} alt="Scanned envelope" className="rounded-lg border max-h-64 w-full object-contain" style={{ borderColor: "var(--color-border)" }} />
          ) : (
            <div className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
          )}
        </div>
      )}

      {ballot.original_application && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-muted)" }}>
            Original absentee application
          </p>
          <dl className="space-y-2 text-sm">
            <DetailRow label="Application #" value={ballot.original_application.application_number} />
            <DetailRow label="Submitted name" value={ballot.original_application.submitted_full_name} />
            <DetailRow label="Submitted address" value={ballot.original_application.submitted_address} />
          </dl>
        </div>
      )}
    </section>
  )
}
