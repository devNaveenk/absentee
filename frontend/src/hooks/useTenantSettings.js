import { useEffect, useState } from "react"
import { useNotify } from "../context/NotificationContext"
import { api } from "../lib/api"
import { useTenantConfig } from "./useTenantConfig"

/** Owns all Settings-page state, API calls, and business rules (processing
 *  mode, reason lists, branding, team management) so the page/tab components
 *  stay purely presentational -- they read what this hook returns and call
 *  its handlers, nothing more. */
export function useTenantSettings() {
  const notify = useNotify()
  const { tenant, loading, refetch } = useTenantConfig()

  const [savingMode, setSavingMode] = useState(false)

  const [reasonLists, setReasonLists] = useState({})
  const [savingReasons, setSavingReasons] = useState(false)

  const [branding, setBranding] = useState({ display_name: "", currency: "USD" })
  const [savingBranding, setSavingBranding] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "tenant_user" })
  const [creatingUser, setCreatingUser] = useState(false)

  useEffect(() => {
    if (!tenant) return
    setReasonLists({
      application_rejection_reasons: tenant.application_rejection_reasons || [],
      application_cure_reasons: tenant.application_cure_reasons || [],
      ballot_rejection_reasons: tenant.ballot_rejection_reasons || [],
      received_via_options: tenant.received_via_options || [],
    })
    setBranding({ display_name: tenant.display_name || "", currency: tenant.currency || "USD" })
  }, [tenant])

  const loadUsers = () => {
    setLoadingUsers(true)
    api
      .get("/tenant/settings/users")
      .then((res) => setUsers(res.data))
      .catch(() => notify("Could not load team members.", "error"))
      .finally(() => setLoadingUsers(false))
  }

  useEffect(loadUsers, [])

  const addReasonItem = (key) => setReasonLists((r) => ({ ...r, [key]: [...(r[key] || []), ""] }))
  const updateReasonItem = (key, idx, value) =>
    setReasonLists((r) => ({ ...r, [key]: r[key].map((v, i) => (i === idx ? value : v)) }))
  const removeReasonItem = (key, idx) =>
    setReasonLists((r) => ({ ...r, [key]: r[key].filter((_, i) => i !== idx) }))

  const saveProcessingMode = async (mode) => {
    if (mode === tenant?.processing_mode) return
    setSavingMode(true)
    try {
      await api.patch("/tenant/settings/processing-mode", { processing_mode: mode })
      notify(`Switched to ${mode === "scan" ? "Scan" : "Manual"} Mode`, "success")
      await refetch()
    } catch (err) {
      notify(err.response?.data?.detail || "Could not update processing mode.", "error")
    } finally {
      setSavingMode(false)
    }
  }

  const saveReasonLists = async () => {
    setSavingReasons(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(reasonLists).map(([k, v]) => [k, v.map((s) => s.trim()).filter(Boolean)])
      )
      await api.patch("/tenant/settings/reasons", payload)
      notify("Reason lists updated", "success")
      await refetch()
    } catch (err) {
      notify(err.response?.data?.detail || "Could not update reason lists.", "error")
    } finally {
      setSavingReasons(false)
    }
  }

  const saveBranding = async () => {
    setSavingBranding(true)
    try {
      await api.patch("/tenant/settings/branding", branding)
      notify("Branding updated", "success")
      await refetch()
    } catch (err) {
      notify(err.response?.data?.detail || "Could not update branding.", "error")
    } finally {
      setSavingBranding(false)
    }
  }

  const uploadLogo = async () => {
    if (!logoFile) return
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", logoFile)
      await api.post("/tenant/settings/branding/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      notify("Logo uploaded", "success")
      setLogoFile(null)
      await refetch()
    } catch (err) {
      notify(err.response?.data?.detail || "Could not upload logo.", "error")
    } finally {
      setUploadingLogo(false)
    }
  }

  const createUser = async (e) => {
    e.preventDefault()
    setCreatingUser(true)
    try {
      await api.post("/tenant/settings/users", newUser)
      notify(`Added ${newUser.email} to the team`, "success")
      setNewUser({ email: "", password: "", role: "tenant_user" })
      loadUsers()
    } catch (err) {
      notify(err.response?.data?.detail || "Could not add team member.", "error")
    } finally {
      setCreatingUser(false)
    }
  }

  const toggleUserStatus = async (user) => {
    try {
      await api.patch(`/tenant/settings/users/${user.id}/status`, null, { params: { is_active: !user.is_active } })
      notify(`${user.email} ${user.is_active ? "deactivated" : "reactivated"}`, "success")
      loadUsers()
    } catch (err) {
      notify(err.response?.data?.detail || "Could not update team member.", "error")
    }
  }

  return {
    tenant,
    loading,
    processingMode: { savingMode, saveProcessingMode },
    reasons: { reasonLists, savingReasons, addReasonItem, updateReasonItem, removeReasonItem, saveReasonLists },
    brandingState: {
      branding,
      setBranding,
      savingBranding,
      saveBranding,
      logoFile,
      setLogoFile,
      uploadingLogo,
      uploadLogo,
    },
    team: { users, loadingUsers, newUser, setNewUser, creatingUser, createUser, toggleUserStatus },
  }
}
