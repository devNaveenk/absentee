import { useRef } from "react"

/** A single clickable upload target -- the whole area opens the native file
 *  picker (instead of the easy-to-miss default browser "Choose File" control),
 *  and shows the selected filename in place so it's obvious a file was picked
 *  before the submit button is enabled. */
export default function FileDropzone({ id, label, file, onChange, accept, helpText }) {
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) onChange(dropped)
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="sr-only"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="cursor-pointer w-full rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors duration-150 hover:opacity-80"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}
      >
        {file ? (
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              {file.name}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-accent)" }}>
              Click to choose a different file
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Click to choose a file, or drag one here
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
              Image or PDF
            </p>
          </div>
        )}
      </div>
      {helpText && (
        <p className="text-xs mt-1.5" style={{ color: "var(--color-muted)" }}>
          {helpText}
        </p>
      )}
    </div>
  )
}
