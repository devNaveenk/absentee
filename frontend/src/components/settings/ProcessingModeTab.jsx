const MODE_OPTIONS = [
  { value: "manual", label: "Manual Mode" },
  { value: "scan", label: "Scan Mode" },
]

export default function ProcessingModeTab({ tenant, savingMode, saveProcessingMode }) {
  return (
    <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-base font-semibold mb-1">Processing Mode</h2>
      <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
        Manual Mode uses direct data-entry forms. Scan Mode uploads an image/PDF and extracts fields via OCR.
      </p>
      <div className="flex gap-3">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={savingMode}
            onClick={() => saveProcessingMode(opt.value)}
            className="cursor-pointer flex-1 rounded-lg px-4 py-2.5 text-sm font-medium border disabled:opacity-60"
            style={
              tenant?.processing_mode === opt.value
                ? { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)", borderColor: "var(--color-primary)" }
                : { color: "var(--color-foreground)", borderColor: "var(--color-border)" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </section>
  )
}
