import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNotify } from "../context/NotificationContext"
import { api } from "../lib/api"

export const LOGS_PAGE_SIZE = 50

const TENANTS_KEY = ["superadmin", "tenants"]
const SUMMARY_KEY = ["superadmin", "usage-summary"]
const LOGS_KEY = (offset) => ["superadmin", "usage-logs", offset]

/** Owns all Superadmin Platform Overview state and API calls -- tenant list,
 *  usage summary, paginated usage logs, rate-limit editing, suspend/reactivate
 *  -- so the page and its table sub-components stay purely presentational. */
export function useSuperadminDashboard() {
  const notify = useNotify()
  const queryClient = useQueryClient()

  const [logsOffset, setLogsOffset] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  const tenantsQuery = useQuery({ queryKey: TENANTS_KEY, queryFn: () => api.get("/superadmin/tenants").then((res) => res.data) })
  const summaryQuery = useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: () => api.get("/superadmin/usage-summary", { params: { hours: 24 } }).then((res) => res.data),
  })
  const logsQuery = useQuery({
    queryKey: LOGS_KEY(logsOffset),
    queryFn: () =>
      api.get("/superadmin/usage-logs", { params: { offset: logsOffset, limit: LOGS_PAGE_SIZE } }).then((res) => res.data),
    placeholderData: keepPreviousData,
  })

  const loading = tenantsQuery.isLoading || summaryQuery.isLoading
  const error = tenantsQuery.isError || summaryQuery.isError
    ? "Could not load dashboard data. Please retry."
    : logsQuery.isError
      ? "Could not load usage logs. Please retry."
      : ""

  const loadAll = () => {
    queryClient.invalidateQueries({ queryKey: TENANTS_KEY })
    queryClient.invalidateQueries({ queryKey: SUMMARY_KEY })
  }

  const startEdit = (tenant) => {
    setEditingId(tenant.id)
    setEditValue(String(tenant.requests_per_minute ?? 120))
  }

  const rateLimitMutation = useMutation({
    mutationFn: ({ tenantId, requests_per_minute }) =>
      api.patch(`/superadmin/tenants/${tenantId}/rate-limit`, { requests_per_minute }),
    onSuccess: () => {
      notify("Rate limit updated", "success")
      setEditingId(null)
      loadAll()
    },
    onError: (err) => notify(err.response?.data?.detail || "Could not update rate limit.", "error"),
  })
  const saveEdit = (tenantId) => {
    const value = Number(editValue)
    if (!Number.isFinite(value) || value <= 0) return
    rateLimitMutation.mutate({ tenantId, requests_per_minute: value })
  }

  const statusMutation = useMutation({
    mutationFn: (tenant) => api.patch(`/superadmin/tenants/${tenant.id}/status`, null, { params: { is_active: !tenant.is_active } }),
    onSuccess: (_data, tenant) => {
      notify(`${tenant.name} ${tenant.is_active ? "suspended" : "reactivated"}`, "success")
      loadAll()
    },
    onError: (err) => notify(err.response?.data?.detail || "Could not update tenant status.", "error"),
  })
  const toggleStatus = (tenant) => statusMutation.mutate(tenant)

  const tenants = tenantsQuery.data ?? []
  const summary = summaryQuery.data ?? []
  const totalRequests = summary.reduce((sum, s) => sum + s.total_requests, 0)
  const totalLimited = summary.reduce((sum, s) => sum + s.rate_limited_requests, 0)

  return {
    tenants,
    summary,
    logs: logsQuery.data?.items ?? [],
    logsTotal: logsQuery.data?.total ?? 0,
    logsOffset,
    setLogsOffset,
    logsLoading: logsQuery.isLoading,
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
