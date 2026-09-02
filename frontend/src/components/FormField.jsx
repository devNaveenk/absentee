/** Shared labeled input for simple create/edit forms (voters, etc). */
export default function FormField({ label, idPrefix = "field", ...props }) {
  const id = `${idPrefix}-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--color-border)" }}
      />
    </div>
  )
}
