import Modal, { ModalActions } from "../Modal"

export default function RejectBallotModal({ rejectReason, setRejectReason, rejectionReasons, onClose, onConfirm, busy }) {
  return (
    <Modal title="Reject Returned Ballot" onClose={onClose}>
      <label className="block text-sm font-medium mb-1.5">Rejection reason</label>
      <select
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        {rejectionReasons.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <ModalActions onCancel={onClose} onConfirm={onConfirm} confirmLabel="Reject" busy={busy} danger />
    </Modal>
  )
}
