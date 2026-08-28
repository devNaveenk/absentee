import { useNavigate } from "react-router-dom"

/** Returns to wherever the user came from (dashboard, queue, etc.) rather than a fixed route. */
export default function BackButton({ fallback = "/dashboard", label = "Back" }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium mb-4"
      style={{ color: "var(--color-muted)" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}
