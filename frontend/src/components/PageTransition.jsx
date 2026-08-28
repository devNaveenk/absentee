import { useLocation } from "react-router-dom"

/** Re-keys its children on every route change so the CSS fade-in animation
 *  replays, giving a smooth transition between pages without a routing library. */
export default function PageTransition({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  )
}
