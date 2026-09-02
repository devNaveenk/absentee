import { useEffect, useState } from "react"
import { useNotify } from "../context/NotificationContext"
import { api } from "../lib/api"

export const LOGS_PAGE_SIZE = 50

/** Owns all Superadmin Platform Overview state and API calls -- tenant list,
 *  usage summary, paginated usage logs, rate-limit editing, suspend/reactivate
 *  -- so the page and its table sub-components stay purely presentational. */
export function useSuperadminDashboard() {
  const notify = useNotify()
  const [tenants, setTenants] = useState([])
  const [summary, setSummary] = useState([])
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsOffset, setLogsOffset] = useState(0)
  const [logsLoading, setLogsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError("")
    try {
      const [tenantsRes, summaryRes] = await Promise.all([
        api.get("/superadmin/tenants"),
        api.get("/superadmin/usage-summary", { params: { hours: 24 } }),
      ])
      setTenants(tenantsRes.data)
      setSummary(summaryRes.data)
    } catch {
      setError("Could not load dashboard data. Please retry.")
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await api.get("/superadmin/usage-logs", {
        params: { offset: logsOffset, limit: LOGS_PAGE_SIZE },
      })
      setLogs(res.data.items)
      setLogsTotal(res.data.total)
    } catch {
      setError("Could not load usage logs. Please retry.")
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsOffset])

  const startEdit = (tenant) => {
    setEditingId(tenant.id)
    setEditValue(String(tenant.requests_per_minute ?? 120))
  }

  const saveEdit = async (tenantId) => {
    const value = Number(editValue)
    if (!Number.isFinite(value) || value <= 0) return
    try {
      await api.patch(`/superadmin/tenants/${tenantId}/rate-limit`, { requests_per_minute: value })
      notify("Rate limit updated", "success")
      setEditingId(null)
      loadAll()
    } catch (err) {
      notify(err.response?.data?.detail || "Could not update rate limit.", "error")
    }
  }

  const toggleStatus = async (tenant) => {
    try {
      await api.patch(`/superadmin/tenants/${tenant.id}/status`, null, {
        params: { is_active: !tenant.is_active },
      })
      notify(`${tenant.name} ${tenant.is_active ? "suspended" : "reactivated"}`, "success")
      loadAll()
    } catch (err) {
      notify(err.response?.data?.detail || "Could not update tenant status.", "error")
    }
  }

  const totalRequests = summary.reduce((sum, s) => sum + s.total_requests, 0)
  const totalLimited = summary.reduce((sum, s) => sum + s.rate_limited_requests, 0)

  return {
    tenants,
    summary,
    logs,
    logsTotal,
    logsOffset,
    setLogsOffset,
    logsLoading,
    loading,
    error,
    loadAll,
    editingId,
    editValue,
    setEditValue,
    startEdit,
    saveEdit,
    setEditingId,
    toggleStatus,
    showCreate,
    setShowCreate,
    totalRequests,
    totalLimited,
  }
}
