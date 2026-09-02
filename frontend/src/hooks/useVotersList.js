import { useEffect, useState } from "react"
import { api } from "../lib/api"

export const VOTERS_PAGE_SIZE = 25

/** Owns the voter roll list -- paginated fetch, loading/error state. Modal
 *  open/close state stays in the page since it's trivial UI state, not
 *  business logic worth hiding behind a hook. */
export function useVotersList() {
  const [voters, setVoters] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    setLoading(true)
    setError("")
    api
      .get("/voters", { params: { offset, limit: VOTERS_PAGE_SIZE } })
      .then((res) => {
        setVoters(res.data.items)
        setTotal(res.data.total)
      })
      .catch(() => setError("Could not load voters."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [offset])

  return { voters, total, offset, setOffset, loading, error, load }
}
