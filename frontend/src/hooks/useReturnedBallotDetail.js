import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useNotify } from "../context/NotificationContext"
import { useAuthedObjectUrl } from "./useAuthedObjectUrl"
import { useTenantConfig } from "./useTenantConfig"
import { api } from "../lib/api"

const ballotQueryKey = (id) => ["returned-ballot", id]

/** Owns everything about the Returned Ballot Detail page that isn't
 *  presentation: loading the record, match-voter/verify/reject actions,
 *  and the tenant-derived rejection-reason list -- mirrors
 *  useApplicationDetail.js's shape for the equivalent Phase 2 workflow. */
export function useReturnedBallotDetail() {
  const { id } = useParams()
  const notify = useNotify()
  const queryClient = useQueryClient()

  const [actionError, setActionError] = useState("")

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

  const { data: ballot, isLoading: loading, isError } = useQuery({
    queryKey: ballotQueryKey(id),
    queryFn: () => api.get(`/returned-ballots/${id}`).then((res) => res.data),
  })

  const envelopeImageUrl = useAuthedObjectUrl(ballot?.has_envelope_scan ? `/returned-ballots/${id}/envelope-image` : null)
  const signatureUrl = useAuthedObjectUrl(ballot?.voter?.has_signature ? `/voters/${ballot.voter.id}/signature` : null)
  const requestSignatureUrl = useAuthedObjectUrl(
    ballot?.original_application?.has_signature ? `/applications/${ballot.original_application.id}/signature` : null
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ballotQueryKey(id) })

  // See useApplicationDetail.js for why this factory is named with a `use`
  // prefix even though it isn't a component: it calls useMutation, so both
  // eslint's rules-of-hooks and readers need to recognize it as a hook.
  const useActionMutation = ({ mutationFn, successMessage, onSuccess }) =>
    useMutation({
      mutationFn,
      onSuccess: (data) => {
        setActionError("")
        if (successMessage) notify(successMessage, "success")
        invalidate()
        onSuccess?.(data)
      },
      onError: (err) => {
        const message = err.response?.data?.detail || "Action failed."
        setActionError(message)
        notify(message, "error")
      },
    })

  const matchVoterMutation = useActionMutation({
    mutationFn: (voter) => api.post(`/returned-ballots/${id}/match-voter`, { voter_id: voter.id }).then(() => voter),
  })
  const handleMatchVoter = (voter) =>
    matchVoterMutation.mutate(voter, { onSuccess: () => notify(`Matched to ${voter.full_name}`, "success") })

  const verifyMutation = useActionMutation({
    mutationFn: () => api.post(`/returned-ballots/${id}/verify`, { verification_checklist: checklist }),
    successMessage: "Ballot verified — routed to Final Bin",
  })
  const handleVerify = () => verifyMutation.mutate()

  const rejectMutation = useActionMutation({
    mutationFn: () => api.post(`/returned-ballots/${id}/reject`, { reason: rejectReason }),
    successMessage: "Ballot rejected",
    onSuccess: () => setShowReject(false),
  })
  const handleReject = () => rejectMutation.mutate()

  const busy = matchVoterMutation.isPending || verifyMutation.isPending || rejectMutation.isPending

  const canDecide = ballot?.status === "received"
  const allChecked = verificationMethods.every((m) => checklist[m])

  return {
    ballot,
    loading,
    error: isError ? "Could not load this returned ballot." : "",
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
