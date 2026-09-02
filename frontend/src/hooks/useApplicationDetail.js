import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useNotify } from "../context/NotificationContext"
import { useAuthedObjectUrl } from "./useAuthedObjectUrl"
import { useTenantConfig } from "./useTenantConfig"
import { api } from "../lib/api"

function optionList(values) {
  return (values || []).map((v) => ({ value: v, label: v.replaceAll("_", " ") }))
}

const EMPTY_FORM = { submitted_full_name: "", submitted_address: "", submitted_dl_number: "", mailing_address: "", received_via: "" }

const applicationQueryKey = (id) => ["application", id]

/** Owns everything about the Application Detail page that isn't presentation:
 *  loading the record, the approve/reject/cure/reapply/edit business actions,
 *  and the tenant-derived option lists the modals need. Keeps the page and
 *  its sub-components purely about rendering what this hook returns. Every
 *  mutation invalidates this application's query so the detail view reflects
 *  the new status immediately, same effect the old load()-after-action had. */
export function useApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const notify = useNotify()
  const queryClient = useQueryClient()

  const [actionError, setActionError] = useState("")

  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const [showCure, setShowCure] = useState(false)
  const [cureReason, setCureReason] = useState("")
  const [notifyVia, setNotifyVia] = useState("email")

  const [showReapply, setShowReapply] = useState(false)
  const [reapplyForm, setReapplyForm] = useState(EMPTY_FORM)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_FORM)

  const { tenant } = useTenantConfig()
  const verificationMethods = tenant?.verification_methods || []
  const rejectionReasons = optionList(tenant?.application_rejection_reasons)
  const cureReasons = optionList(tenant?.application_cure_reasons)
  const receivedViaOptions = optionList(tenant?.received_via_options)
  const [checklist, setChecklist] = useState({})

  useEffect(() => {
    if (rejectionReasons.length && !rejectReason) setRejectReason(rejectionReasons[0].value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  const { data: application, isLoading: loading, isError } = useQuery({
    queryKey: applicationQueryKey(id),
    queryFn: () => api.get(`/applications/${id}`).then((res) => res.data),
  })

  useEffect(() => {
    if (!application) return
    const formFields = {
      submitted_full_name: application.submitted_full_name,
      submitted_address: application.submitted_address,
      submitted_dl_number: application.submitted_dl_number || "",
      mailing_address: application.mailing_address || "",
      received_via: application.received_via || "",
    }
    setEditForm(formFields)
    setReapplyForm(formFields)
  }, [application])

  const scanImageUrl = useAuthedObjectUrl(application?.has_scan_image ? `/applications/${id}/scan-image` : null)
  const signatureUrl = useAuthedObjectUrl(
    application?.voter?.has_signature ? `/voters/${application.voter.id}/signature` : null
  )
  const requestSignatureUrl = useAuthedObjectUrl(application?.has_signature ? `/applications/${id}/signature` : null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: applicationQueryKey(id) })

  // Named with a `use` prefix (not `runMutation`) even though it's a plain
  // factory, not a component -- it calls useMutation internally, so eslint's
  // rules-of-hooks and readers alike need to recognize it as a hook. Called
  // unconditionally, a fixed number of times, in the same order every
  // render below -- satisfies the Rules of Hooks the same as any other hook.
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
    mutationFn: (voter) => api.post(`/applications/${id}/match-voter`, { voter_id: voter.id }).then(() => voter),
    successMessage: null,
  })
  const handleMatchVoter = (voter) =>
    matchVoterMutation.mutate(voter, { onSuccess: () => notify(`Matched to ${voter.full_name}`, "success") })

  const approveMutation = useActionMutation({
    mutationFn: () => api.post(`/applications/${id}/approve`, { verification_checklist: checklist }),
    successMessage: "Application approved — pending ABS mail-out",
  })
  const handleApprove = () => approveMutation.mutate()

  const markAbsSentMutation = useActionMutation({
    mutationFn: () => api.post(`/applications/${id}/mark-abs-sent`),
    successMessage: "Marked as ABS Sent",
  })
  const handleMarkAbsSent = () => markAbsSentMutation.mutate()

  const rejectMutation = useActionMutation({
    mutationFn: () => api.post(`/applications/${id}/reject`, { reason: rejectReason }),
    successMessage: "Application rejected",
    onSuccess: () => setShowReject(false),
  })
  const handleReject = () => rejectMutation.mutate()

  const cureMutation = useActionMutation({
    mutationFn: () => api.post(`/applications/${id}/cure`, { reason: cureReason, notify_via: notifyVia }),
    successMessage: "Moved to Cure — voter will be notified",
    onSuccess: () => setShowCure(false),
  })
  const handleCure = () => cureMutation.mutate()

  const saveEditMutation = useActionMutation({
    mutationFn: () => api.patch(`/applications/${id}`, editForm),
    successMessage: "Application fields updated",
    onSuccess: () => setEditing(false),
  })
  const handleSaveEdit = () => saveEditMutation.mutate()

  const reapplyMutation = useActionMutation({
    mutationFn: () => api.post(`/applications/${id}/reapply`, reapplyForm).then((res) => res.data),
    successMessage: "Reapplication submitted",
    onSuccess: (data) => {
      setShowReapply(false)
      navigate(`/applications/${data.id}`)
    },
  })
  const handleReapply = () => reapplyMutation.mutate()

  const busy =
    matchVoterMutation.isPending ||
    approveMutation.isPending ||
    markAbsSentMutation.isPending ||
    rejectMutation.isPending ||
    cureMutation.isPending ||
    saveEditMutation.isPending ||
    reapplyMutation.isPending

  const canDecide = application?.status === "unprocessed"
  const allChecked = verificationMethods.every((m) => checklist[m])

  return {
    application,
    loading,
    error: isError ? "Could not load this application." : "",
    actionError,
    busy,
    canDecide,
    allChecked,
    verificationMethods,
    rejectionReasons,
    cureReasons,
    receivedViaOptions,
    checklist,
    setChecklist,
    scanImageUrl,
    signatureUrl,
    requestSignatureUrl,
    editing,
    setEditing,
    editForm,
    setEditForm,
    handleSaveEdit,
    handleMatchVoter,
    handleApprove,
    handleMarkAbsSent,
    handleReject,
    handleCure,
    handleReapply,
    showReject,
    setShowReject,
    rejectReason,
    setRejectReason,
    showCure,
    setShowCure,
    cureReason,
    setCureReason,
    notifyVia,
    setNotifyVia,
    showReapply,
    setShowReapply,
    reapplyForm,
    setReapplyForm,
  }
}
