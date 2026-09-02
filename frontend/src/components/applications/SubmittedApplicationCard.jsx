import DetailRow from "../DetailRow"
import EditField from "../EditField"

export default function SubmittedApplicationCard({
  application,
  canDecide,
  editing,
  setEditing,
  editForm,
  setEditForm,
  receivedViaOptions,
  busy,
  handleSaveEdit,
  scanImageUrl,
  requestSignatureUrl,
}) {
  return (
    <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Submitted Application</h2>
        {canDecide && !editing && (
          <button onClick={() => setEditing(true)} className="cursor-pointer text-xs font-medium underline" style={{ color: "var(--color-accent)" }}>
            Edit fields
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <EditField label="Full name" value={editForm.submitted_full_name} onChange={(v) => setEditForm((f) => ({ ...f, submitted_full_name: v }))} />
          <EditField label="Address" value={editForm.submitted_address} onChange={(v) => setEditForm((f) => ({ ...f, submitted_address: v }))} />
          <EditField label="DL number" value={editForm.submitted_dl_number} onChange={(v) => setEditForm((f) => ({ ...f, submitted_dl_number: v }))} />
          <EditField label="Mailing address (if different)" value={editForm.mailing_address} onChange={(v) => setEditForm((f) => ({ ...f, mailing_address: v }))} />
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>Received via</label>
            <select
              value={editForm.received_via}
              onChange={(e) => setEditForm((f) => ({ ...f, received_via: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)" }}
            >
              <option value="">—</option>
              {receivedViaOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} disabled={busy} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}>
              Save
            </button>
            <button onClick={() => setEditing(false)} className="cursor-pointer text-sm font-medium px-3 py-2" style={{ color: "var(--color-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <dl className="space-y-3 text-sm">
          <DetailRow label="Full name" value={application.submitted_full_name} />
          <DetailRow label="Address" value={application.submitted_address} />
          <DetailRow label="DL number" value={application.submitted_dl_number || "—"} />
          <DetailRow label="Mailing address" value={application.mailing_address || "—"} />
          <DetailRow label="Received via" value={application.received_via ? application.received_via.replaceAll("_", " ") : "—"} />
        </dl>
      )}

      {application.has_scan_image && (
        <div className="mt-4">
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
            Scanned image
          </p>
          {scanImageUrl ? (
            <img src={scanImageUrl} alt="Scanned application" className="rounded-lg border max-h-64 w-full object-contain" style={{ borderColor: "var(--color-border)" }} />
          ) : (
            <div className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
          )}
        </div>
      )}

      {application.has_signature && (
        <div className="mt-4">
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
            Request Form Signature
          </p>
          {requestSignatureUrl ? (
            <img src={requestSignatureUrl} alt="Request form signature" className="rounded-lg border bg-white max-h-32" style={{ borderColor: "var(--color-border)" }} />
          ) : (
            <div className="h-24 w-64 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
          )}
        </div>
      )}
    </section>
  )
}
