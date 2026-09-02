/** Small presentational building blocks shared across the Superadmin
 *  dashboard's cards/tables/modal -- kept together since none is large
 *  enough alone to justify its own file. */

export function StatCard({ label, value, loading, tone = "default" }) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <p className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>
        {label}
      </p>
      {loading ? (
        <div className="h-8 w-20 rounded animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
      ) : (
        <p
          className="text-2xl font-semibold font-mono-num"
          style={{ color: tone === "warn" && value !== "0" ? "var(--color-destructive)" : "var(--color-foreground)" }}
        >
          {value}
        </p>
      )}
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>
        {title}
      </h2>
      <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        {children}
      </div>
    </div>
  )
}

export function StatusBadge({ active }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={
        active
          ? { backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }
          : { backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: active ? "var(--color-success)" : "var(--color-destructive)" }}
      />
      {active ? "Active" : "Suspended"}
    </span>
  )
}

export function SkeletonRows({ rows }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
      ))}
    </div>
  )
}

export function EmptyState({ message }) {
  return (
    <p className="text-sm py-6 text-center" style={{ color: "var(--color-muted)" }}>
      {message}
    </p>
  )
}

export function Field({ label, ...props }) {
  const id = `field-${label.replace(/\s+/g, "-").toLowerCase()}`
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
