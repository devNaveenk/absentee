import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import AppShell from "../components/AppShell"
import BackButton from "../components/BackButton"
import FileDropzone from "../components/FileDropzone"
import VoterSearchInput from "../components/VoterSearchInput"
import { useNotify } from "../context/NotificationContext"
import { useTenantConfig } from "../hooks/useTenantConfig"
import { api } from "../lib/api"

export default function NewReturnedBallot() {
  const navigate = useNavigate()
  const notify = useNotify()
  const { tenant, loading: loadingTenant } = useTenantConfig()
  const processingMode = loadingTenant ? null : tenant?.processing_mode || "manual"
  const [form, setForm] = useState({ submitted_full_name: "", submitted_address: "" })
  const [voter, setVoter] = useState(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState("")

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const manualMutation = useMutation({
    mutationFn: () => api.post("/returned-ballots", { ...form, voter_id: voter?.id || null }).then((res) => res.data),
    onSuccess: (data) => {
      notify(`Returned ballot ${data.tracking_number} recorded`, "success")
      navigate(`/returned-ballots/${data.id}`)
    },
    onError: (err) => {
      const message = err.response?.data?.detail || "Could not record returned ballot."
      setError(message)
      notify(message, "error")
    },
  })
  const submitManual = (e) => {
    e.preventDefault()
    setError("")
    manualMutation.mutate()
  }

  const scanMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append("file", file)
      return api.post("/returned-ballots/scan", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((res) => res.data)
    },
    onSuccess: (data) => {
      notify(`Returned ballot ${data.tracking_number} recorded from scan`, "success")
      navigate(`/returned-ballots/${data.id}`)
    },
    onError: (err) => {
      const message = err.response?.data?.detail || "Could not process envelope scan."
      setError(message)
      notify(message, "error")
    },
  })
  const submitScan = (e) => {
    e.preventDefault()
    if (!file) {
      setError("Choose a scanned envelope image first.")
      return
    }
    setError("")
    scanMutation.mutate()
  }

  return (
    <AppShell role="tenant">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <BackButton fallback="/returned-ballots" />
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
          Record Returned Ballot
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
          {processingMode === "scan"
            ? "Scan Mode: upload the outer envelope / flap image to extract voter information via OCR."
            : "Manual Mode: enter the outer envelope information below."}
        </p>

        {error && (
          <div role="alert" className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
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
              id="envelope-file"
              label="Scanned envelope / flap image"
              file={file}
              onChange={setFile}
              accept="image/*,.pdf"
              helpText="OCR only accelerates identification — final acceptance always requires manual verification against the Unified Voter Profile on the next screen."
            />
            <button
              type="submit"
              disabled={scanMutation.isPending || !file}
              className="cursor-pointer w-full rounded-lg py-2.5 text-base font-medium disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              {scanMutation.isPending ? "Uploading & extracting…" : "Upload & Extract"}
            </button>
          </form>
        ) : processingMode === "manual" ? (
          <form
            onSubmit={submitManual}
            className="rounded-xl border p-6 space-y-4"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <Field label="Full name (as written on envelope)" value={form.submitted_full_name} onChange={update("submitted_full_name")} required />
            <Field label="Address (as written on envelope)" value={form.submitted_address} onChange={update("submitted_address")} required />

            <div>
              <label className="block text-sm font-medium mb-1.5">Link to voter record (optional now, required for final approval)</label>
              {voter ? (
                <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5" style={{ borderColor: "var(--color-border)" }}>
                  <div>
                    <p className="text-sm font-medium">{voter.full_name}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {voter.registered_address}
                    </p>
                  </div>
                  <button type="button" onClick={() => setVoter(null)} className="cursor-pointer text-xs font-medium underline" style={{ color: "var(--color-destructive)" }}>
                    Remove
                  </button>
                </div>
              ) : (
                <VoterSearchInput onSelect={setVoter} />
              )}
            </div>

            <button
              type="submit"
              disabled={manualMutation.isPending}
              className="cursor-pointer w-full rounded-lg py-2.5 text-base font-medium disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              {manualMutation.isPending ? "Recording…" : "Record Returned Ballot"}
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
