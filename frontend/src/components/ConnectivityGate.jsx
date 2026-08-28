import { useEffect, useState } from "react"
import { onConnectivityLost } from "../lib/api"
import ServiceUnavailable from "./ServiceUnavailable"

/** Shows a full-page "service unavailable" fallback whenever any API call fails
 *  because the backend is completely unreachable, on top of whatever page is showing. */
export default function ConnectivityGate({ children }) {
  const [down, setDown] = useState(false)

  useEffect(() => onConnectivityLost(() => setDown(true)), [])

  return (
    <>
      {children}
      {down && <ServiceUnavailable onRetry={() => window.location.reload()} />}
    </>
  )
}
