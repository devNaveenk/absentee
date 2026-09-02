/** Shared labeled text input for inline-edit forms (application/reapply fields). */
export default function EditField({ label, value, onChange }) {
  const id = `edit-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--color-border)" }}
      />
    </div>
  )
}
