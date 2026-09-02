import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"

export const TENANT_ME_QUERY_KEY = ["tenant", "me"]

/** Fetches the current tenant's processing mode + verification checklist config.
 *  Shared by the intake and review screens instead of each re-fetching /api/tenant/me.
 *  Exports its query key so mutations elsewhere (Settings saves) can invalidate the
 *  same cached entry instead of each hook managing its own copy of tenant state. */
export function useTenantConfig() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: TENANT_ME_QUERY_KEY,
    queryFn: () => api.get("/tenant/me").then((res) => res.data?.tenant || null),
  })

  return { tenant: data ?? null, loading: isLoading, refetch }
}
