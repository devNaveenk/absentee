import { useEffect, useState } from "react"
import AppShell from "../components/AppShell"
import BackButton from "../components/BackButton"
import { useNotify } from "../context/NotificationContext"
import { useAuthedObjectUrl } from "../hooks/useAuthedObjectUrl"
import { useTenantConfig } from "../hooks/useTenantConfig"
import { api } from "../lib/api"

const REASON_LIST_FIELDS = [
  { key: "application_rejection_reasons", label: "Application Rejection Reasons" },
  { key: "application_cure_reasons", label: "Application Cure Reasons" },
  { key: "ballot_rejection_reasons", label: "Returned Ballot Rejection Reasons" },
  { key: "received_via_options", label: "Received Via Options" },
]

export default function TenantSettings() {
  const notify = useNotify()
  const { tenant, loading } = useTenantConfig()
  const [reasonLists, setReasonLists] = useState({})
  const [savingReasons, setSavingReasons] = useState(false)

  const [branding, setBranding] = useState({ display_name: "", currency: "USD" })
  const [savingBranding, setSavingBranding] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoUrl = useAuthedObjectUrl(tenant?.has_logo ? "/tenant/settings/branding/logo" : null)

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

  const saveReasonLists = async () => {
    setSavingReasons(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(reasonLists).map(([k, v]) => [k, v.map((s) => s.trim()).filter(Boolean)])
      )
      await api.patch("/tenant/settings/reasons", payload)
      notify("Reason lists updated", "success")
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

  if (loading) {
    return (
      <AppShell role="tenant">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell role="tenant">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BackButton fallback="/dashboard" />
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
          Settings
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
          Configure reason lists, branding, and your team.
        </p>

        {/* Reason Lists */}
        <section className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-base font-semibold mb-4">Reason Lists</h2>
          <div className="space-y-5">
            {REASON_LIST_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">{label}</label>
                  <button
                    type="button"
                    onClick={() => addReasonItem(key)}
                    className="cursor-pointer text-xs font-medium underline"
                    style={{ color: "var(--color-accent)" }}
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {(reasonLists[key] || []).map((value, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={value}
                        onChange={(e) => updateReasonItem(key, idx, e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeReasonItem(key, idx)}
                        className="cursor-pointer text-xs font-medium"
                        style={{ color: "var(--color-destructive)" }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(reasonLists[key] || []).length === 0 && (
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>No options yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={saveReasonLists}
            disabled={savingReasons}
            className="cursor-pointer mt-5 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            {savingReasons ? "Saving…" : "Save reason lists"}
          </button>
        </section>

        {/* Branding */}
        <section className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-base font-semibold mb-4">Branding</h2>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>Display name</label>
              <input
                value={branding.display_name}
                onChange={(e) => setBranding((b) => ({ ...b, display_name: e.target.value }))}
                placeholder={tenant?.name}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>Currency</label>
              <select
                value={branding.currency}
                onChange={(e) => setBranding((b) => ({ ...b, currency: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer"
                style={{ borderColor: "var(--color-border)" }}
              >
                {["USD", "EUR", "GBP", "CAD"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={saveBranding}
            disabled={savingBranding}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            {savingBranding ? "Saving…" : "Save branding"}
          </button>

          <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-sm font-medium mb-2">Logo</p>
            {logoUrl && <img src={logoUrl} alt="Current logo" className="h-10 w-auto mb-3" />}
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-sm" />
              <button
                onClick={uploadLogo}
                disabled={!logoFile || uploadingLogo}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
              >
                {uploadingLogo ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="text-base font-semibold mb-4">Team</h2>
          {loadingUsers ? (
            <div className="h-20 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
          ) : (
            <div className="space-y-2 mb-5">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                  <div>
                    <span className="font-medium">{u.email}</span>{" "}
                    <span
                      className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
                    >
                      {u.role.replaceAll("_", " ")}
                    </span>
                    {!u.is_active && (
                      <span className="ml-1 text-xs" style={{ color: "var(--color-destructive)" }}>inactive</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleUserStatus(u)}
                    className="cursor-pointer text-xs font-medium underline"
                    style={{ color: u.is_active ? "var(--color-destructive)" : "var(--color-accent)" }}
                  >
                    {u.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="email"
              required
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)" }}
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)" }}
            />
            <div className="flex gap-2">
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer flex-1"
                style={{ borderColor: "var(--color-border)" }}
              >
                <option value="tenant_user">Tenant User</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
              <button
                type="submit"
                disabled={creatingUser}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
              >
                {creatingUser ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
