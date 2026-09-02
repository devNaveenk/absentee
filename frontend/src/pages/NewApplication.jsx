import { useState } from "react"
import { useNavigate } from "react-router-dom"
import AppShell from "../components/AppShell"
import BackButton from "../components/BackButton"
import FileDropzone from "../components/FileDropzone"
import VoterSearchInput from "../components/VoterSearchInput"
import { useNotify } from "../context/NotificationContext"
import { useTenantConfig } from "../hooks/useTenantConfig"
import { api } from "../lib/api"

export default function NewApplication() {
  const navigate = useNavigate()
  const notify = useNotify()
  const { tenant, loading: loadingTenant } = useTenantConfig()
  const processingMode = loadingTenant ? null : tenant?.processing_mode || "manual"
  const receivedViaOptions = tenant?.received_via_options || []
  const [form, setForm] = useState({
    submitted_full_name: "",
    submitted_address: "",
    submitted_dl_number: "",
    mailing_address: "",
    received_via: "",
  })
  const [voter, setVoter] = useState(null)
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submitManual = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const { data } = await api.post("/applications", { ...form, voter_id: voter?.id || null })
      notify(`Application ${data.application_number} created`, "success")
      navigate(`/applications/${data.id}`)
    } catch (err) {
      const message = err.response?.data?.detail || "Could not create application."
      setError(message)
      notify(message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  const submitScan = async (e) => {
    e.preventDefault()
    if (!file) {
      setError("Choose a scanned image or PDF first.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const { data } = await api.post("/applications/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      notify(`Application ${data.application_number} created from scan`, "success")
      navigate(`/applications/${data.id}`)
    } catch (err) {
      const message = err.response?.data?.detail || "Could not process scan."
      setError(message)
      notify(message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell role="tenant">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <BackButton fallback="/applications" />
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
          New Absentee Application
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
          {processingMode === "scan"
            ? "This tenant is in Scan Mode. Upload the application image to extract voter information via OCR."
            : "This tenant is in Manual Mode. Enter the application details below."}
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg px-4 py-3 text-sm"
            style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
          >
            {error}
          </div>
        )}

        {processingMode === "scan" ? (
          <form
            onSubmit={submitScan}
            className="rounded-xl border p-6 space-y-4"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <FileDropzone
              id="scan-file"
              label="Scanned application image"
              file={file}
              onChange={setFile}
              accept="image/*,.pdf"
              helpText="Document AI (free-text extraction) will attempt to read the name, address, and DL number. You'll verify and correct the extracted fields on the next screen."
            />
            <button
              type="submit"
              disabled={submitting || !file}
              className="cursor-pointer w-full rounded-lg py-2.5 text-base font-medium disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              {submitting ? "Uploading & extracting…" : "Upload & Extract"}
            </button>
          </form>
        ) : processingMode === "manual" ? (
          <form
            onSubmit={submitManual}
            className="rounded-xl border p-6 space-y-4"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <Field label="Full name (as submitted)" value={form.submitted_full_name} onChange={update("submitted_full_name")} required />
            <Field label="Address (as submitted)" value={form.submitted_address} onChange={update("submitted_address")} required />
            <Field label="Driver's License number (optional)" value={form.submitted_dl_number} onChange={update("submitted_dl_number")} />
            <Field label="Mailing address (if different, optional)" value={form.mailing_address} onChange={update("mailing_address")} />

            <div>
              <label htmlFor="received-via" className="block text-sm font-medium mb-1.5">
                Received via (optional)
              </label>
              <select
                id="received-via"
                value={form.received_via}
                onChange={update("received_via")}
                className="w-full rounded-lg border px-3.5 py-2.5 text-base outline-none"
                style={{ borderColor: "var(--color-border)" }}
              >
                <option value="">—</option>
                {receivedViaOptions.map((o) => (
                  <option key={o} value={o}>
                    {o.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Link to voter record (optional now, required to approve)</label>
              {voter ? (
                <div
                  className="flex items-center justify-between rounded-lg border px-3.5 py-2.5"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div>
                    <p className="text-sm font-medium">{voter.full_name}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {voter.registered_address}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoter(null)}
                    className="cursor-pointer text-xs font-medium underline"
                    style={{ color: "var(--color-destructive)" }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <VoterSearchInput onSelect={setVoter} />
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer w-full rounded-lg py-2.5 text-base font-medium disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              {submitting ? "Creating…" : "Create Application"}
            </button>
          </form>
        ) : (
          <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
        )}
      </div>
    </AppShell>
  )
}

function Field({ label, ...props }) {
  const id = `field-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-lg border px-3.5 py-2.5 text-base outline-none"
        style={{ borderColor: "var(--color-border)" }}
      />
    </div>
  )
}
