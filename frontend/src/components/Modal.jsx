export default function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: "var(--color-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function ModalActions({ onCancel, onConfirm, confirmLabel, busy, danger }) {
  return (
    <div className="flex justify-end gap-3">
      <button onClick={onCancel} className="cursor-pointer px-4 py-2 text-sm font-medium" style={{ color: "var(--color-muted)" }}>
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={busy}
        className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        style={
          danger
            ? { backgroundColor: "var(--color-destructive)", color: "#fff" }
            : { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }
        }
      >
        {busy ? "Working…" : confirmLabel}
      </button>
    </div>
  )
}
