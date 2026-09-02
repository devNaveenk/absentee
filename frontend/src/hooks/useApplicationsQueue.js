import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

const queryKey = (view, status, reapprovalOnly) => ["applications", view, status, reapprovalOnly]

/** Owns the Applications queue list fetch -- keyed by the same view/status/
 *  reapproval filters the page already derives from the URL, so switching
 *  tabs is just a query-key change (cached instantly if visited before)
 *  instead of a manual refetch. */
export function useApplicationsQueue(view, status, reapprovalOnly) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey(view, status, reapprovalOnly),
    queryFn: () => {
      const params = { view }
      if (view === "processed" && status) params.status = status
      if (reapprovalOnly) params.reapproval_only = true
      return api.get("/applications", { params }).then((res) => res.data)
    },
    placeholderData: keepPreviousData,
  })

  const load = () => queryClient.invalidateQueries({ queryKey: ["applications"] })

  return { applications: data ?? [], loading: isLoading, error: isError ? "Could not load applications." : "", load }
}
