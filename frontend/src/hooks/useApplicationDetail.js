import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useNotify } from "../context/NotificationContext"
import { useAuthedObjectUrl } from "./useAuthedObjectUrl"
import { useTenantConfig } from "./useTenantConfig"
import { api } from "../lib/api"

function optionList(values) {
  return (values || []).map((v) => ({ value: v, label: v.replaceAll("_", " ") }))
}

const EMPTY_FORM = { submitted_full_name: "", submitted_address: "", submitted_dl_number: "", mailing_address: "", received_via: "" }

/** Owns everything about the Application Detail page that isn't presentation:
 *  loading the record, the approve/reject/cure/reapply/edit business actions,
 *  and the tenant-derived option lists the modals need. Keeps the page and
 *  its sub-components purely about rendering what this hook returns. */
export function useApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const notify = useNotify()

  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

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
    if (cureReasons.length && !cureReason) setCureReason(cureReasons[0].value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  const load = useCallback(() => {
    setLoading(true)
    setError("")
    api
      .get(`/applications/${id}`)
      .then((res) => {
        setApplication(res.data)
        const formFields = {
          submitted_full_name: res.data.submitted_full_name,
          submitted_address: res.data.submitted_address,
          submitted_dl_number: res.data.submitted_dl_number || "",
          mailing_address: res.data.mailing_address || "",
          received_via: res.data.received_via || "",
        }
        setEditForm(formFields)
        setReapplyForm(formFields)
      })
      .catch(() => setError("Could not load this application."))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(load, [load])

  const scanImageUrl = useAuthedObjectUrl(application?.has_scan_image ? `/applications/${id}/scan-image` : null)
  const signatureUrl = useAuthedObjectUrl(
    application?.voter?.has_signature ? `/voters/${application.voter.id}/signature` : null
  )
  const requestSignatureUrl = useAuthedObjectUrl(application?.has_signature ? `/applications/${id}/signature` : null)

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
    runAction(() => api.post(`/applications/${id}/match-voter`, { voter_id: voter.id }), `Matched to ${voter.full_name}`)

  const handleApprove = () =>
    runAction(
      () => api.post(`/applications/${id}/approve`, { verification_checklist: checklist }),
      "Application approved — pending ABS mail-out"
    )

  const handleMarkAbsSent = () =>
    runAction(() => api.post(`/applications/${id}/mark-abs-sent`), "Marked as ABS Sent")

  const handleReject = () =>
    runAction(async () => {
      await api.post(`/applications/${id}/reject`, { reason: rejectReason })
      setShowReject(false)
    }, "Application rejected")

  const handleCure = () =>
    runAction(async () => {
      await api.post(`/applications/${id}/cure`, { reason: cureReason, notify_via: notifyVia })
      setShowCure(false)
    }, "Moved to Cure — voter will be notified")

  const handleSaveEdit = () =>
    runAction(async () => {
      await api.patch(`/applications/${id}`, editForm)
      setEditing(false)
    }, "Application fields updated")

  const handleReapply = () =>
    runAction(async () => {
      const { data } = await api.post(`/applications/${id}/reapply`, reapplyForm)
      setShowReapply(false)
      navigate(`/applications/${data.id}`)
    }, "Reapplication submitted")

  const canDecide = application?.status === "unprocessed"
  const allChecked = verificationMethods.every((m) => checklist[m])

  return {
    application,
    loading,
    error,
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
