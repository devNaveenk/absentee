import { useEffect, useState } from "react"
import { api } from "../lib/api"

/** Fetches an authenticated file endpoint (scan image, signature, envelope) as a blob
 *  and exposes it as an object URL, since a plain <img src> can't carry the auth header. */
export function useAuthedObjectUrl(path) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let objectUrl
    let cancelled = false
    api
      .get(path, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data)
        setUrl(objectUrl)
      })
      .catch(() => setUrl(null))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [path])

  return url
}
