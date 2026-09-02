import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useNotify } from "../context/NotificationContext"
import { useAuthedObjectUrl } from "./useAuthedObjectUrl"
import { useTenantConfig } from "./useTenantConfig"
import { api } from "../lib/api"

/** Owns everything about the Returned Ballot Detail page that isn't
 *  presentation: loading the record, match-voter/verify/reject actions,
 *  and the tenant-derived rejection-reason list -- mirrors
 *  useApplicationDetail.js's shape for the equivalent Phase 2 workflow. */
export function useReturnedBallotDetail() {
  const { id } = useParams()
  const notify = useNotify()

  const [ballot, setBallot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const { tenant } = useTenantConfig()
  const verificationMethods = tenant?.verification_methods || []
  const rejectionReasons = (tenant?.ballot_rejection_reasons || []).map((v) => ({ value: v, label: v.replaceAll("_", " ") }))
  const [checklist, setChecklist] = useState({})

  useEffect(() => {
    if (rejectionReasons.length && !rejectReason) setRejectReason(rejectionReasons[0].value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

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
  const requestSignatureUrl = useAuthedObjectUrl(
    ballot?.original_application?.has_signature ? `/applications/${ballot.original_application.id}/signature` : null
  )

  const runAction = async (fn, successMessage) => {
    setActionError("")
    setBusy(true)
    try {
      await fn()
      if (successMessage) notify(successMessage, "success")
      load()
    } catch (err) {
      const message = err.response?.data?.detail || "Action failed."
      setActionError(message)
      notify(message, "error")
    } finally {
      setBusy(false)
    }
  }

  const handleMatchVoter = (voter) =>
    runAction(() => api.post(`/returned-ballots/${id}/match-voter`, { voter_id: voter.id }), `Matched to ${voter.full_name}`)
  const handleVerify = () =>
    runAction(
      () => api.post(`/returned-ballots/${id}/verify`, { verification_checklist: checklist }),
      "Ballot verified — routed to Final Bin"
    )
  const handleReject = () =>
    runAction(async () => {
      await api.post(`/returned-ballots/${id}/reject`, { reason: rejectReason })
      setShowReject(false)
    }, "Ballot rejected")

  const canDecide = ballot?.status === "received"
  const allChecked = verificationMethods.every((m) => checklist[m])

  return {
    ballot,
    loading,
    error,
    actionError,
    busy,
    canDecide,
    allChecked,
    verificationMethods,
    rejectionReasons,
    checklist,
    setChecklist,
    envelopeImageUrl,
    signatureUrl,
    requestSignatureUrl,
    handleMatchVoter,
    handleVerify,
    handleReject,
    showReject,
    setShowReject,
    rejectReason,
    setRejectReason,
  }
}
