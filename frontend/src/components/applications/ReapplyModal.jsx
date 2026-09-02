import EditField from "../EditField"
import Modal, { ModalActions } from "../Modal"

export default function ReapplyModal({ reapplyForm, setReapplyForm, onClose, onConfirm, busy }) {
  return (
    <Modal title="File Reapplication" onClose={onClose}>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
        Enter the corrected information as resubmitted by the voter. This creates a linked application in the
        Reapproval Queue.
      </p>
      <div className="space-y-3 mb-4">
        <EditField label="Full name" value={reapplyForm.submitted_full_name} onChange={(v) => setReapplyForm((f) => ({ ...f, submitted_full_name: v }))} />
        <EditField label="Address" value={reapplyForm.submitted_address} onChange={(v) => setReapplyForm((f) => ({ ...f, submitted_address: v }))} />
        <EditField label="DL number" value={reapplyForm.submitted_dl_number} onChange={(v) => setReapplyForm((f) => ({ ...f, submitted_dl_number: v }))} />
        <EditField label="Mailing address (if different)" value={reapplyForm.mailing_address} onChange={(v) => setReapplyForm((f) => ({ ...f, mailing_address: v }))} />
      </div>
      <ModalActions onCancel={onClose} onConfirm={onConfirm} confirmLabel="Submit Reapplication" busy={busy} />
    </Modal>
  )
}
