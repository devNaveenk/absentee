export default function DetailRow({ label, value, required }) {
  return (
    <div>
      <dt className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
        {label}
        {required && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
          >
            required
          </span>
        )}
      </dt>
      <dd>{value}</dd>
    </div>
  )
}
