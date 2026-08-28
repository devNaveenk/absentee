import { useEffect, useState } from "react"
import AppShell from "../components/AppShell"
import Modal, { ModalActions } from "../components/Modal"
import { api } from "../lib/api"

const PAGE_SIZE = 25

const EMPTY_FORM = {
  full_name: "",
  registered_address: "",
  external_voter_id: "",
  dl_number: "",
  veteran_id: "",
  passport_id: "",
  date_of_birth: "",
}

export default function VotersPage() {
  const [voters, setVoters] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [showAdd, setShowAdd] = useState(false)
  const [editingVoter, setEditingVoter] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const load = () => {
    setLoading(true)
    setError("")
    api
      .get("/voters", { params: { offset, limit: PAGE_SIZE } })
      .then((res) => {
        setVoters(res.data.items)
        setTotal(res.data.total)
      })
      .catch(() => setError("Could not load voters."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [offset])

  const openEdit = (voter) => setEditingVoter(voter)

  const hasNextPage = offset + PAGE_SIZE < total
  const hasPrevPage = offset > 0

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

        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
              ))}
            </div>
          ) : voters.length === 0 ? (
            <p className="text-sm py-12 text-center" style={{ color: "var(--color-muted)" }}>
              No voters yet. Add one manually or import a CSV of your voter roll.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: "var(--color-muted)" }}>
                    <th className="py-2.5 px-4 font-medium">Voter ID</th>
                    <th className="py-2.5 px-4 font-medium">Full Name</th>
                    <th className="py-2.5 px-4 font-medium">Address</th>
                    <th className="py-2.5 px-4 font-medium">DL Number</th>
                    <th className="py-2.5 px-4 font-medium">Signature</th>
                    <th className="py-2.5 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((v) => (
                    <tr key={v.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                      <td className="py-3 px-4 font-mono-num" style={{ color: "var(--color-muted)" }}>
                        {v.external_voter_id || "—"}
                      </td>
                      <td className="py-3 px-4 font-medium">{v.full_name}</td>
                      <td className="py-3 px-4">{v.registered_address}</td>
                      <td className="py-3 px-4 font-mono-num">{v.dl_number || "—"}</td>
                      <td className="py-3 px-4">
                        {v.has_signature ? (
                          <span style={{ color: "var(--color-primary)" }}>On file</span>
                        ) : (
                          <span style={{ color: "var(--color-muted)" }}>None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEdit(v)}
                          className="cursor-pointer text-xs font-medium underline"
                          style={{ color: "var(--color-accent)" }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && total > PAGE_SIZE && (
            <div
              className="flex items-center justify-between px-4 py-3 border-t text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
            >
              <span>
                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!hasPrevPage}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  className="cursor-pointer rounded-md px-3 py-1.5 border disabled:opacity-40"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  Previous
                </button>
                <button
                  disabled={!hasNextPage}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                  className="cursor-pointer rounded-md px-3 py-1.5 border disabled:opacity-40"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
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

function VoterFormModal({ voter, onClose, onSaved }) {
  const isEdit = !!voter
  const [form, setForm] = useState(
    voter
      ? {
          full_name: voter.full_name || "",
          registered_address: voter.registered_address || "",
          external_voter_id: voter.external_voter_id || "",
          dl_number: voter.dl_number || "",
          veteran_id: voter.veteran_id || "",
          passport_id: voter.passport_id || "",
          date_of_birth: "",
        }
      : EMPTY_FORM
  )
  const [signatureFile, setSignatureFile] = useState(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const toPayload = () => ({
    full_name: form.full_name,
    registered_address: form.registered_address,
    external_voter_id: form.external_voter_id || null,
    dl_number: form.dl_number || null,
    veteran_id: form.veteran_id || null,
    passport_id: form.passport_id || null,
    date_of_birth: form.date_of_birth || null,
  })

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const voterId = isEdit
        ? (await api.patch(`/voters/${voter.id}`, toPayload())).data.id
        : (await api.post("/voters", toPayload())).data.id

      if (signatureFile) {
        const formData = new FormData()
        formData.append("file", signatureFile)
        await api.post(`/voters/${voterId}/signature`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save voter.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEdit ? "Edit Voter" : "Add Voter"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            {error}
          </div>
        )}
        <Field label="Full name" value={form.full_name} onChange={update("full_name")} required />
        <Field label="Registered address" value={form.registered_address} onChange={update("registered_address")} required />
        <Field label="External voter ID (optional)" value={form.external_voter_id} onChange={update("external_voter_id")} />
        <Field label="Driver's License number (optional)" value={form.dl_number} onChange={update("dl_number")} />
        <Field label="Veteran ID (optional)" value={form.veteran_id} onChange={update("veteran_id")} />
        <Field label="Passport ID (optional)" value={form.passport_id} onChange={update("passport_id")} />
        <Field label="Date of birth (optional)" type="date" value={form.date_of_birth} onChange={update("date_of_birth")} />

        <div>
          <label htmlFor="signature-file" className="block text-sm font-medium mb-1.5">
            Signature image {isEdit && voter.has_signature ? "(replace, optional)" : "(optional)"}
          </label>
          <input
            id="signature-file"
            type="file"
            accept="image/*"
            onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </div>

        <ModalActions onCancel={onClose} onConfirm={submit} confirmLabel={isEdit ? "Save changes" : "Add voter"} busy={submitting} />
      </form>
    </Modal>
  )
}

const CSV_TEMPLATE_HEADERS = [
  "full_name",
  "registered_address",
  "external_voter_id",
  "date_of_birth",
  "dl_number",
  "veteran_id",
  "passport_id",
]
const CSV_TEMPLATE_EXAMPLE_ROW = [
  "Jane Q. Voter",
  "123 Main St, Springfield, GA 30301",
  "GA-000123456",
  "1985-06-15",
  "012345678",
  "",
  "",
]

function csvEscape(value) {
  const str = String(value ?? "")
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function downloadVoterCsvTemplate() {
  const rows = [CSV_TEMPLATE_HEADERS, CSV_TEMPLATE_EXAMPLE_ROW]
  const csvContent = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "voter-roll-template.csv"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function ImportCsvModal({ onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState(null)

  const submit = async () => {
    if (!file) {
      setError("Choose a CSV file first.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const { data } = await api.post("/voters/import-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setSummary(data)
      onImported()
    } catch (err) {
      setError(err.response?.data?.detail || "Could not import CSV.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Import Voter Roll (CSV)" onClose={onClose}>
      <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>
        Required columns: <code>full_name</code>, <code>registered_address</code>. Optional: <code>external_voter_id</code>,{" "}
        <code>date_of_birth</code> (YYYY-MM-DD), <code>dl_number</code>, <code>veteran_id</code>, <code>passport_id</code>. Rows with a
        matching <code>external_voter_id</code> update the existing voter instead of creating a duplicate.
      </p>

      <button
        type="button"
        onClick={downloadVoterCsvTemplate}
        className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium underline mb-4"
        style={{ color: "var(--color-accent)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Download CSV template
      </button>

      {error && (
        <div role="alert" className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
          {error}
        </div>
      )}

      {summary ? (
        <div className="mb-4 text-sm space-y-2">
          <p>
            <span className="font-medium" style={{ color: "var(--color-primary)" }}>
              {summary.created}
            </span>{" "}
            created,{" "}
            <span className="font-medium" style={{ color: "var(--color-primary)" }}>
              {summary.updated}
            </span>{" "}
            updated,{" "}
            <span className="font-medium" style={{ color: summary.skipped > 0 ? "var(--color-destructive)" : "inherit" }}>
              {summary.skipped}
            </span>{" "}
            skipped.
          </p>
          {summary.errors.length > 0 && (
            <ul className="rounded-lg border p-3 max-h-40 overflow-y-auto space-y-1" style={{ borderColor: "var(--color-border)" }}>
              {summary.errors.map((e, i) => (
                <li key={i} style={{ color: "var(--color-destructive)" }}>
                  Row {e.row}: {e.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm mb-4"
        />
      )}

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="cursor-pointer px-4 py-2 text-sm font-medium" style={{ color: "var(--color-muted)" }}>
          {summary ? "Close" : "Cancel"}
        </button>
        {!summary && (
          <button
            onClick={submit}
            disabled={submitting}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            {submitting ? "Importing…" : "Import"}
          </button>
        )}
      </div>
    </Modal>
  )
}

function Field({ label, ...props }) {
  const id = `voter-field-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--color-border)" }}
      />
    </div>
  )
}
