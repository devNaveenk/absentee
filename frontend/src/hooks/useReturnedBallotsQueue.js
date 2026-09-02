import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

const queryKey = (view, status) => ["returned-ballots", view, status]

/** Owns the Returned Ballots queue list fetch, mirroring useApplicationsQueue.js. */
export function useReturnedBallotsQueue(view, status) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKey(view, status),
    queryFn: () => {
      const params = { view }
      if (view === "processed" && status) params.status = status
      return api.get("/returned-ballots", { params }).then((res) => res.data)
    },
    placeholderData: keepPreviousData,
  })

  const load = () => queryClient.invalidateQueries({ queryKey: ["returned-ballots"] })

  return { ballots: data ?? [], loading: isLoading, error: isError ? "Could not load returned ballots." : "", load }
}
