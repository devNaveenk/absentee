import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNotify } from "../../context/NotificationContext"
import { api } from "../../lib/api"
import Modal from "../Modal"

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

export default function ImportCsvModal({ onClose, onImported }) {
  const notify = useNotify()
  const [file, setFile] = useState(null)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState(null)

  const importMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append("file", file)
      return api.post("/voters/import-csv", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data)
    },
    onSuccess: (data) => {
      setSummary(data)
      notify(`Imported: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped`, data.skipped > 0 ? "warning" : "success")
      onImported()
    },
    onError: (err) => {
      const message = err.response?.data?.detail || "Could not import CSV."
      setError(message)
      notify(message, "error")
    },
  })

  const submit = () => {
    if (!file) {
      setError("Choose a CSV file first.")
      return
    }
    setError("")
    importMutation.mutate()
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
          {summary.warnings?.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-warning)" }}>
                {summary.warnings.length} row{summary.warnings.length === 1 ? "" : "s"} imported with a field skipped:
              </p>
              <ul
                className="rounded-lg border p-3 max-h-40 overflow-y-auto space-y-1"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-warning-bg)" }}
              >
                {summary.warnings.map((w, i) => (
                  <li key={i} style={{ color: "var(--color-warning)" }}>
                    Row {w.row}: {w.error}
                  </li>
                ))}
              </ul>
            </div>
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
            disabled={importMutation.isPending}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            {importMutation.isPending ? "Importing…" : "Import"}
          </button>
        )}
      </div>
    </Modal>
  )
}
