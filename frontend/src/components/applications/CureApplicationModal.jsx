import Modal, { ModalActions } from "../Modal"

const NOTIFY_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "mail", label: "Physical mail" },
  { value: "both", label: "Email + physical mail" },
]

export default function CureApplicationModal({
  cureReason,
  setCureReason,
  cureReasons,
  notifyVia,
  setNotifyVia,
  onClose,
  onConfirm,
  busy,
}) {
  return (
    <Modal title="Move to Cure" onClose={onClose}>
      <label className="block text-sm font-medium mb-1.5">Discrepancy</label>
      <select
        value={cureReason}
        onChange={(e) => setCureReason(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        {cureReasons.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <label className="block text-sm font-medium mb-1.5">Notify voter via</label>
      <select
        value={notifyVia}
        onChange={(e) => setNotifyVia(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        {NOTIFY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ModalActions onCancel={onClose} onConfirm={onConfirm} confirmLabel="Move to Cure" busy={busy} />
    </Modal>
  )
}
