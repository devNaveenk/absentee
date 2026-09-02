import { useState } from "react"
import AppShell from "../components/AppShell"
import ImportCsvModal from "../components/voters/ImportCsvModal"
import VoterFormModal from "../components/voters/VoterFormModal"
import VotersTable from "../components/voters/VotersTable"
import { useVotersList } from "../hooks/useVotersList"

export default function VotersPage() {
  const { voters, total, offset, setOffset, loading, error, load } = useVotersList()
  const [showAdd, setShowAdd] = useState(false)
  const [editingVoter, setEditingVoter] = useState(null)
  const [showImport, setShowImport] = useState(false)

  return (
    <AppShell role="tenant">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              Voter Roll
            </h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              {total.toLocaleString()} voter{total === 1 ? "" : "s"} on file for this tenant.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
            >
              Import CSV
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              + Add Voter
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg px-4 py-3 text-sm flex items-center justify-between"
            style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
          >
            <span>{error}</span>
            <button onClick={load} className="cursor-pointer underline font-medium">
              Retry
            </button>
          </div>
        )}

        <VotersTable
          voters={voters}
          total={total}
          offset={offset}
          setOffset={setOffset}
          loading={loading}
          openEdit={setEditingVoter}
        />
      </div>

      {(showAdd || editingVoter) && (
        <VoterFormModal
          voter={editingVoter}
          onClose={() => {
            setShowAdd(false)
            setEditingVoter(null)
          }}
          onSaved={() => {
            setShowAdd(false)
            setEditingVoter(null)
            load()
          }}
        />
      )}

      {showImport && <ImportCsvModal onClose={() => setShowImport(false)} onImported={load} />}
    </AppShell>
  )
}
