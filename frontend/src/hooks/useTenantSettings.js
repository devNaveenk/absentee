import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useNotify } from "../context/NotificationContext"
import { api } from "../lib/api"
import { TENANT_ME_QUERY_KEY, useTenantConfig } from "./useTenantConfig"

const TEAM_QUERY_KEY = ["tenant", "settings", "users"]

/** Owns all Settings-page state, API calls, and business rules (processing
 *  mode, reason lists, branding, team management) so the page/tab components
 *  stay purely presentational -- they read what this hook returns and call
 *  its handlers, nothing more. Mutations invalidate TENANT_ME_QUERY_KEY so
 *  every consumer of useTenantConfig (header logo, nav, forms) picks up the
 *  change immediately instead of each screen tracking its own stale copy. */
export function useTenantSettings() {
  const notify = useNotify()
  const queryClient = useQueryClient()
  const { tenant, loading } = useTenantConfig()

  const invalidateTenant = () => queryClient.invalidateQueries({ queryKey: TENANT_ME_QUERY_KEY })

  const [reasonLists, setReasonLists] = useState({})
  const [branding, setBranding] = useState({ display_name: "", currency: "USD" })
  const [logoFile, setLogoFile] = useState(null)
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "tenant_user" })

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

  const usersQuery = useQuery({
    queryKey: TEAM_QUERY_KEY,
    queryFn: () => api.get("/tenant/settings/users").then((res) => res.data),
  })

  const addReasonItem = (key) => setReasonLists((r) => ({ ...r, [key]: [...(r[key] || []), ""] }))
  const updateReasonItem = (key, idx, value) =>
    setReasonLists((r) => ({ ...r, [key]: r[key].map((v, i) => (i === idx ? value : v)) }))
  const removeReasonItem = (key, idx) =>
    setReasonLists((r) => ({ ...r, [key]: r[key].filter((_, i) => i !== idx) }))

  const modeMutation = useMutation({
    mutationFn: (mode) => api.patch("/tenant/settings/processing-mode", { processing_mode: mode }),
    onSuccess: (_data, mode) => {
      notify(`Switched to ${mode === "scan" ? "Scan" : "Manual"} Mode`, "success")
      invalidateTenant()
    },
    onError: (err) => notify(err.response?.data?.detail || "Could not update processing mode.", "error"),
  })
  const saveProcessingMode = (mode) => {
    if (mode === tenant?.processing_mode) return
    modeMutation.mutate(mode)
  }

  const reasonsMutation = useMutation({
    mutationFn: (payload) => api.patch("/tenant/settings/reasons", payload),
    onSuccess: () => {
      notify("Reason lists updated", "success")
      invalidateTenant()
    },
    onError: (err) => notify(err.response?.data?.detail || "Could not update reason lists.", "error"),
  })
  const saveReasonLists = () => {
    const payload = Object.fromEntries(
      Object.entries(reasonLists).map(([k, v]) => [k, v.map((s) => s.trim()).filter(Boolean)])
    )
    reasonsMutation.mutate(payload)
  }

  const brandingMutation = useMutation({
    mutationFn: (payload) => api.patch("/tenant/settings/branding", payload),
    onSuccess: () => {
      notify("Branding updated", "success")
      invalidateTenant()
    },
    onError: (err) => notify(err.response?.data?.detail || "Could not update branding.", "error"),
  })
  const saveBranding = () => brandingMutation.mutate(branding)

  const logoMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData()
      formData.append("file", file)
      return api.post("/tenant/settings/branding/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    },
    onSuccess: () => {
      notify("Logo uploaded", "success")
      setLogoFile(null)
      invalidateTenant()
    },
    onError: (err) => notify(err.response?.data?.detail || "Could not upload logo.", "error"),
  })
  const uploadLogo = () => {
    if (!logoFile) return
    logoMutation.mutate(logoFile)
  }

  const createUserMutation = useMutation({
    mutationFn: (payload) => api.post("/tenant/settings/users", payload),
    onSuccess: (_data, payload) => {
      notify(`Added ${payload.email} to the team`, "success")
      setNewUser({ email: "", password: "", role: "tenant_user" })
      queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY })
    },
    onError: (err) => notify(err.response?.data?.detail || "Could not add team member.", "error"),
  })
  const createUser = (e) => {
    e.preventDefault()
    createUserMutation.mutate(newUser)
  }

  const toggleStatusMutation = useMutation({
    mutationFn: (user) =>
      api.patch(`/tenant/settings/users/${user.id}/status`, null, { params: { is_active: !user.is_active } }),
    onSuccess: (_data, user) => {
      notify(`${user.email} ${user.is_active ? "deactivated" : "reactivated"}`, "success")
      queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY })
    },
    onError: (err) => notify(err.response?.data?.detail || "Could not update team member.", "error"),
  })
  const toggleUserStatus = (user) => toggleStatusMutation.mutate(user)

  return {
    tenant,
    loading,
    processingMode: { savingMode: modeMutation.isPending, saveProcessingMode },
    reasons: {
      reasonLists,
      savingReasons: reasonsMutation.isPending,
      addReasonItem,
      updateReasonItem,
      removeReasonItem,
      saveReasonLists,
    },
    brandingState: {
      branding,
      setBranding,
      savingBranding: brandingMutation.isPending,
      saveBranding,
      logoFile,
      setLogoFile,
      uploadingLogo: logoMutation.isPending,
      uploadLogo,
    },
    team: {
      users: usersQuery.data ?? [],
      loadingUsers: usersQuery.isLoading,
      newUser,
      setNewUser,
      creatingUser: createUserMutation.isPending,
      createUser,
      toggleUserStatus,
    },
  }
}
