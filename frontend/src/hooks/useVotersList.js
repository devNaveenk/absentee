import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "../lib/api"

export const VOTERS_PAGE_SIZE = 25
const VOTERS_QUERY_KEY = (offset) => ["voters", offset]

/** Owns the voter roll list -- paginated fetch, loading/error state.
 *  keepPreviousData avoids a loading flash when paging, and load() maps to
 *  invalidating the current page's cache entry so callers (voter save/import
 *  modals) can force a refresh the same way they did with the old manual
 *  fetch function. Modal open/close state stays in the page since it's
 *  trivial UI state, not business logic worth hiding behind a hook. */
export function useVotersList() {
  const [offset, setOffset] = useState(0)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: VOTERS_QUERY_KEY(offset),
    queryFn: () => api.get("/voters", { params: { offset, limit: VOTERS_PAGE_SIZE } }).then((res) => res.data),
    placeholderData: keepPreviousData,
  })

  const load = () => queryClient.invalidateQueries({ queryKey: ["voters"] })

  return {
    voters: data?.items ?? [],
    total: data?.total ?? 0,
    offset,
    setOffset,
    loading: isLoading,
    error: isError ? "Could not load voters." : "",
    load,
  }
}
