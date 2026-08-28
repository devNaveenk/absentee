import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import AppShell from "../components/AppShell"
import DetailRow from "../components/DetailRow"
import Modal, { ModalActions } from "../components/Modal"
import VerificationChecklist from "../components/VerificationChecklist"
import VoterSearchInput from "../components/VoterSearchInput"
import { useAuthedObjectUrl } from "../hooks/useAuthedObjectUrl"
import { useTenantConfig } from "../hooks/useTenantConfig"
import { api } from "../lib/api"

const REJECTION_REASONS = [
  { value: "already_voted_in_person", label: "Voter has already voted in person" },
  { value: "moved_outside_jurisdiction", label: "Voter has moved outside the jurisdiction" },
  { value: "deceased", label: "Voter is deceased" },
  { value: "credential_mismatch", label: "Driver's License / credential mismatch" },
  { value: "signature_mismatch", label: "Signature mismatch" },
]

const STATUS_LABELS = {
  received: "Pending Verification",
  verified: "Verified — Final Bin",
  rejected: "Rejected",
}

export default function ReturnedBallotDetail() {
  const { id } = useParams()
  const [ballot, setBallot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0].value)

  const { tenant } = useTenantConfig()
  const verificationMethods = tenant?.verification_methods || []
  const [checklist, setChecklist] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    setError("")
    api
      .get(`/returned-ballots/${id}`)
      .then((res) => setBallot(res.data))
      .catch(() => setError("Could not load this returned ballot."))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(load, [load])

  const envelopeImageUrl = useAuthedObjectUrl(ballot?.has_envelope_scan ? `/returned-ballots/${id}/envelope-image` : null)
  const signatureUrl = useAuthedObjectUrl(ballot?.voter?.has_signature ? `/voters/${ballot.voter.id}/signature` : null)

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

  const handleMatchVoter = (voter) => runAction(() => api.post(`/returned-ballots/${id}/match-voter`, { voter_id: voter.id }))
  const handleVerify = () =>
    runAction(() => api.post(`/returned-ballots/${id}/verify`, { verification_checklist: checklist }))
  const handleReject = () =>
    runAction(async () => {
      await api.post(`/returned-ballots/${id}/reject`, { reason: rejectReason })
      setShowReject(false)
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

  if (error || !ballot) {
    return (
      <AppShell role="tenant">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div role="alert" className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            {error || "Returned ballot not found."}
          </div>
        </div>
      </AppShell>
    )
  }

  const canDecide = ballot.status === "received"
  const allChecked = verificationMethods.every((m) => checklist[m])

  return (
    <AppShell role="tenant">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
              Returned Ballot {ballot.tracking_number}
            </p>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              {ballot.submitted_full_name}
            </h1>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
          >
            {STATUS_LABELS[ballot.status]}
          </span>
        </div>

        {actionError && (
          <div role="alert" className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Outer envelope (left) */}
          <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h2 className="text-base font-semibold mb-4">Outer Envelope / Flap</h2>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Full name (as written)" value={ballot.submitted_full_name} />
              <DetailRow label="Address (as written)" value={ballot.submitted_address} />
            </dl>

            {ballot.has_envelope_scan && (
              <div className="mt-4">
                <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
                  Scanned envelope image
                </p>
                {envelopeImageUrl ? (
                  <img src={envelopeImageUrl} alt="Scanned envelope" className="rounded-lg border max-h-64 w-full object-contain" style={{ borderColor: "var(--color-border)" }} />
                ) : (
                  <div className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
                )}
              </div>
            )}

            {ballot.original_application && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-muted)" }}>
                  Original absentee application
                </p>
                <dl className="space-y-2 text-sm">
                  <DetailRow label="Application #" value={ballot.original_application.application_number} />
                  <DetailRow label="Submitted name" value={ballot.original_application.submitted_full_name} />
                  <DetailRow label="Submitted address" value={ballot.original_application.submitted_address} />
                </dl>
              </div>
            )}
          </section>

          {/* Voter profile (right) */}
          <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h2 className="text-base font-semibold mb-4">Unified Voter Profile</h2>

            {ballot.voter ? (
              <>
                <dl className="space-y-3 text-sm">
                  <DetailRow label="Full name" value={ballot.voter.full_name} required={verificationMethods.includes("full_name")} />
                  <DetailRow label="Registered address" value={ballot.voter.registered_address} required={verificationMethods.includes("address")} />
                  <DetailRow label="DL number" value={ballot.voter.dl_number || "—"} required={verificationMethods.includes("dl_number")} />
                </dl>
                {ballot.voter.has_signature && (
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
                  No voter matched yet. Search to link this ballot to a voter record.
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
              onClick={handleVerify}
              disabled={busy || !ballot.voter_id || !allChecked}
              title={
                !ballot.voter_id
                  ? "Match a voter before final approval"
                  : !allChecked
                    ? "Complete the verification checklist before final approval"
                    : undefined
              }
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              Final Approval → Final Bin
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={busy}
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
            >
              Reject
            </button>
          </section>
        )}

        {ballot.status === "rejected" && ballot.rejection_reason && (
          <section className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-sm">
              <span className="font-medium">Rejected:</span>{" "}
              {REJECTION_REASONS.find((r) => r.value === ballot.rejection_reason)?.label}
            </p>
          </section>
        )}

        <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-base font-semibold mb-4">Audit History</h2>
          <ol className="space-y-2 text-sm">
            {ballot.events.map((e) => (
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
        <Modal title="Reject Returned Ballot" onClose={() => setShowReject(false)}>
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
    </AppShell>
  )
}
