import { useEffect, useRef, useState } from "react"
import { api } from "../lib/api"

export default function VoterSearchInput({ onSelect, placeholder = "Search by name, DL number, or voter ID…" }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const handle = setTimeout(() => {
      api
        .get("/voters/search", { params: { q: query.trim(), limit: 10 } })
        .then((res) => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        aria-label="Search voters"
        className="w-full rounded-lg border px-3.5 py-2.5 text-base outline-none"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
      />
      {open && query.trim().length >= 2 && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border shadow-lg"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {loading ? (
            <p className="px-3.5 py-3 text-sm" style={{ color: "var(--color-muted)" }}>
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="px-3.5 py-3 text-sm" style={{ color: "var(--color-muted)" }}>
              No matching voters found.
            </p>
          ) : (
            results.map((voter) => (
              <button
                key={voter.id}
                type="button"
                role="option"
                onClick={() => {
                  onSelect(voter)
                  setQuery("")
                  setResults([])
                  setOpen(false)
                }}
                className="cursor-pointer w-full text-left px-3.5 py-2.5 border-t first:border-t-0 hover:opacity-80"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-medium">{voter.full_name}</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {voter.registered_address}
                  {voter.dl_number ? ` · DL ${voter.dl_number}` : ""}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
