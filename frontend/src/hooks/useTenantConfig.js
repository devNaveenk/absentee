import { useEffect, useState } from "react"
import { api } from "../lib/api"

/** Fetches the current tenant's processing mode + verification checklist config.
 *  Shared by the intake and review screens instead of each re-fetching /api/tenant/me. */
export function useTenantConfig() {
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get("/tenant/me")
      .then((res) => setTenant(res.data?.tenant || null))
      .catch(() => setTenant(null))
      .finally(() => setLoading(false))
  }, [])

  return { tenant, loading }
}
