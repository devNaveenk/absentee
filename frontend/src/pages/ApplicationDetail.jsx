import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AppShell from "../components/AppShell"
import DetailRow from "../components/DetailRow"
import Modal, { ModalActions } from "../components/Modal"
import VerificationChecklist from "../components/VerificationChecklist"
import VoterSearchInput from "../components/VoterSearchInput"
import { useAuthedObjectUrl } from "../hooks/useAuthedObjectUrl"
import { useTenantConfig } from "../hooks/useTenantConfig"
import { api } from "../lib/api"

const REJECTION_REASONS = [
  { value: "out_of_district", label: "Out of District" },
  { value: "record_not_found", label: "Record Not Found" },
]

const CURE_REASONS = [
  { value: "name_mismatch", label: "Name / spelling mismatch" },
  { value: "dl_mismatch", label: "Driver's License mismatch" },
  { value: "other", label: "Other discrepancy" },
]

const NOTIFY_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "mail", label: "Physical mail" },
  { value: "both", label: "Email + physical mail" },
]

const STATUS_LABELS = {
  unprocessed: "Unprocessed",
  abs_sent: "Approved — ABS Sent",
  rejected: "Rejected",
  cure: "Cure",
  reapproved: "Reapproved",
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0].value)

  const [showCure, setShowCure] = useState(false)
  const [cureReason, setCureReason] = useState(CURE_REASONS[0].value)
  const [notifyVia, setNotifyVia] = useState("email")

  const [showReapply, setShowReapply] = useState(false)
  const [reapplyForm, setReapplyForm] = useState({ submitted_full_name: "", submitted_address: "", submitted_dl_number: "" })

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ submitted_full_name: "", submitted_address: "", submitted_dl_number: "" })

  const { tenant } = useTenantConfig()
  const verificationMethods = tenant?.verification_methods || []
  const [checklist, setChecklist] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    setError("")
    api
      .get(`/applications/${id}`)
      .then((res) => {
        setApplication(res.data)
        setEditForm({
          submitted_full_name: res.data.submitted_full_name,
          submitted_address: res.data.submitted_address,
          submitted_dl_number: res.data.submitted_dl_number || "",
        })
        setReapplyForm({
          submitted_full_name: res.data.submitted_full_name,
          submitted_address: res.data.submitted_address,
          submitted_dl_number: res.data.submitted_dl_number || "",
        })
      })
      .catch(() => setError("Could not load this application."))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(load, [load])

  const scanImageUrl = useAuthedObjectUrl(application?.has_scan_image ? `/applications/${id}/scan-image` : null)
  const signatureUrl = useAuthedObjectUrl(
    application?.voter?.has_signature ? `/voters/${application.voter.id}/signature` : null
  )

  const runAction = async (fn) => {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      load()
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.")
    } finally {
      setBusy(false)
    }
  }

  const handleMatchVoter = (voter) =>
    runAction(() => api.post(`/applications/${id}/match-voter`, { voter_id: voter.id }))

  const handleApprove = () =>
    runAction(() => api.post(`/applications/${id}/approve`, { verification_checklist: checklist }))

  const handleReject = () =>
    runAction(async () => {
      await api.post(`/applications/${id}/reject`, { reason: rejectReason })
      setShowReject(false)
    })

  const handleCure = () =>
    runAction(async () => {
      await api.post(`/applications/${id}/cure`, { reason: cureReason, notify_via: notifyVia })
      setShowCure(false)
    })

  const handleSaveEdit = () =>
    runAction(async () => {
      await api.patch(`/applications/${id}`, editForm)
      setEditing(false)
    })

  const handleReapply = () =>
    runAction(async () => {
      const { data } = await api.post(`/applications/${id}/reapply`, reapplyForm)
      setShowReapply(false)
      navigate(`/applications/${data.id}`)
    })

  if (loading) {
    return (
      <AppShell role="tenant">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
        </div>
      </AppShell>
    )
  }

  if (error || !application) {
    return (
      <AppShell role="tenant">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div role="alert" className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#fef2f2", color: "var(--color-destructive)" }}>
            {error || "Application not found."}
          </div>
        </div>
      </AppShell>
    )
  }

  const canDecide = application.status === "unprocessed"
  const allChecked = verificationMethods.every((m) => checklist[m])

  return (
    <AppShell role="tenant">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
              Application {application.application_number}
              {application.is_reapproval && " · Reapproval"}
            </p>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              {application.submitted_full_name}
            </h1>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
          >
            {STATUS_LABELS[application.status]}
          </span>
        </div>

        {actionError && (
          <div role="alert" className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#fef2f2", color: "var(--color-destructive)" }}>
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Submitted application (left) */}
          <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Submitted Application</h2>
              {canDecide && !editing && (
                <button onClick={() => setEditing(true)} className="cursor-pointer text-xs font-medium underline" style={{ color: "var(--color-accent)" }}>
                  Edit fields
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <EditField label="Full name" value={editForm.submitted_full_name} onChange={(v) => setEditForm((f) => ({ ...f, submitted_full_name: v }))} />
                <EditField label="Address" value={editForm.submitted_address} onChange={(v) => setEditForm((f) => ({ ...f, submitted_address: v }))} />
                <EditField label="DL number" value={editForm.submitted_dl_number} onChange={(v) => setEditForm((f) => ({ ...f, submitted_dl_number: v }))} />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={busy} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}>
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="cursor-pointer text-sm font-medium px-3 py-2" style={{ color: "var(--color-muted)" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <DetailRow label="Full name" value={application.submitted_full_name} />
                <DetailRow label="Address" value={application.submitted_address} />
                <DetailRow label="DL number" value={application.submitted_dl_number || "—"} />
              </dl>
            )}

            {application.has_scan_image && (
              <div className="mt-4">
                <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
                  Scanned image
                </p>
                {scanImageUrl ? (
                  <img src={scanImageUrl} alt="Scanned application" className="rounded-lg border max-h-64 w-full object-contain" style={{ borderColor: "var(--color-border)" }} />
                ) : (
                  <div className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
                )}
              </div>
            )}
          </section>

          {/* Voter profile (right) */}
          <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h2 className="text-base font-semibold mb-4">Unified Voter Profile</h2>

            {application.voter ? (
              <>
                <dl className="space-y-3 text-sm">
                  <DetailRow label="Full name" value={application.voter.full_name} required={verificationMethods.includes("full_name")} />
                  <DetailRow label="Registered address" value={application.voter.registered_address} required={verificationMethods.includes("address")} />
                  <DetailRow label="DL number" value={application.voter.dl_number || "—"} required={verificationMethods.includes("dl_number")} />
                  {application.voter.veteran_id && (
                    <DetailRow label="Veteran ID" value={application.voter.veteran_id} required={verificationMethods.includes("veteran_id")} />
                  )}
                  {application.voter.passport_id && (
                    <DetailRow label="Passport ID" value={application.voter.passport_id} required={verificationMethods.includes("passport_id")} />
                  )}
                </dl>
                {application.voter.has_signature && (
                  <div className="mt-4">
                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
                      Signature on file
                    </p>
                    {signatureUrl ? (
                      <img src={signatureUrl} alt="Voter signature" className="rounded-lg border bg-white max-h-32" style={{ borderColor: "var(--color-border)" }} />
                    ) : (
                      <div className="h-24 w-64 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
                    )}
                  </div>
                )}
                {canDecide && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-medium underline" style={{ color: "var(--color-accent)" }}>
                      Change matched voter
                    </summary>
                    <div className="mt-2">
                      <VoterSearchInput onSelect={handleMatchVoter} />
                    </div>
                  </details>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>
                  No voter matched yet. Search to link this application to a voter record.
                </p>
                <VoterSearchInput onSelect={handleMatchVoter} />
              </div>
            )}
          </section>
        </div>

        {canDecide && (
          <VerificationChecklist
            methods={verificationMethods}
            checklist={checklist}
            onChange={(method, value) => setChecklist((c) => ({ ...c, [method]: value }))}
          />
        )}

        {canDecide && (
          <section
            className="rounded-xl border p-5 mb-6 flex flex-wrap gap-3"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <button
              onClick={handleApprove}
              disabled={busy || !application.voter_id || !allChecked}
              title={
                !application.voter_id
                  ? "Match a voter before approving"
                  : !allChecked
                    ? "Complete the verification checklist before approving"
                    : undefined
              }
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              Approve → ABS Sent
            </button>
            <button
              onClick={() => setShowCure(true)}
              disabled={busy}
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
            >
              Move to Cure
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={busy}
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#fef2f2", color: "var(--color-destructive)" }}
            >
              Reject
            </button>
          </section>
        )}

        {application.status === "cure" && (
          <section
            className="rounded-xl border p-5 mb-6"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-semibold">Cure in progress</h2>
                <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                  Reason: {CURE_REASONS.find((r) => r.value === application.cure_reason)?.label} · Notified via{" "}
                  {application.cure_notified_via}
                </p>
              </div>
              <button
                onClick={() => setShowReapply(true)}
                className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
              >
                File Reapplication
              </button>
            </div>
          </section>
        )}

        {/* Audit trail */}
        <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-base font-semibold mb-4">Audit History</h2>
          <ol className="space-y-2 text-sm">
            {application.events.map((e) => (
              <li key={e.id} className="flex items-center justify-between border-t first:border-t-0 pt-2 first:pt-0" style={{ borderColor: "var(--color-border)" }}>
                <span>
                  <span className="font-medium capitalize">{e.action.replaceAll("_", " ")}</span>
                  {e.reason && <span style={{ color: "var(--color-muted)" }}> — {e.reason.replaceAll("_", " ")}</span>}
                </span>
                <span style={{ color: "var(--color-muted)" }}>{new Date(e.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {showReject && (
        <Modal title="Reject Application" onClose={() => setShowReject(false)}>
          <label className="block text-sm font-medium mb-1.5">Rejection reason</label>
          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
            style={{ borderColor: "var(--color-border)" }}
          >
            {REJECTION_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ModalActions onCancel={() => setShowReject(false)} onConfirm={handleReject} confirmLabel="Reject" busy={busy} danger />
        </Modal>
      )}

      {showCure && (
        <Modal title="Move to Cure" onClose={() => setShowCure(false)}>
          <label className="block text-sm font-medium mb-1.5">Discrepancy</label>
          <select
            value={cureReason}
            onChange={(e) => setCureReason(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
            style={{ borderColor: "var(--color-border)" }}
          >
            {CURE_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium mb-1.5">Notify voter via</label>
          <select
            value={notifyVia}
            onChange={(e) => setNotifyVia(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
            style={{ borderColor: "var(--color-border)" }}
          >
            {NOTIFY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ModalActions onCancel={() => setShowCure(false)} onConfirm={handleCure} confirmLabel="Move to Cure" busy={busy} />
        </Modal>
      )}

      {showReapply && (
        <Modal title="File Reapplication" onClose={() => setShowReapply(false)}>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
            Enter the corrected information as resubmitted by the voter. This creates a linked application in the
            Reapproval Queue.
          </p>
          <div className="space-y-3 mb-4">
            <EditField label="Full name" value={reapplyForm.submitted_full_name} onChange={(v) => setReapplyForm((f) => ({ ...f, submitted_full_name: v }))} />
            <EditField label="Address" value={reapplyForm.submitted_address} onChange={(v) => setReapplyForm((f) => ({ ...f, submitted_address: v }))} />
            <EditField label="DL number" value={reapplyForm.submitted_dl_number} onChange={(v) => setReapplyForm((f) => ({ ...f, submitted_dl_number: v }))} />
          </div>
          <ModalActions onCancel={() => setShowReapply(false)} onConfirm={handleReapply} confirmLabel="Submit Reapplication" busy={busy} />
        </Modal>
      )}
    </AppShell>
  )
}

function EditField({ label, value, onChange }) {
  const id = `edit-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--color-border)" }}
      />
    </div>
  )
}
