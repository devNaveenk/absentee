import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

const SUMMARY_KEY = ["dashboard", "summary"]

/** Owns the tenant dashboard's 4-metric-card summary fetch. */
export function useTenantDashboard() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: () => api.get("/dashboard/summary").then((res) => res.data),
  })

  const load = () => queryClient.invalidateQueries({ queryKey: SUMMARY_KEY })

  return { summary: data ?? null, loading: isLoading, error: isError ? "Could not load dashboard metrics." : "", load }
}
