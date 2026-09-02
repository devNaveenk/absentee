import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNotify } from "../../context/NotificationContext"
import { api } from "../../lib/api"
import Modal from "../Modal"
import { Field } from "./DashboardPrimitives"

const VERIFICATION_METHOD_OPTIONS = [
  { value: "full_name", label: "Full name" },
  { value: "address", label: "Registered address" },
  { value: "dl_number", label: "Driver's License number" },
  { value: "signature", label: "Visual signature comparison" },
  { value: "veteran_id", label: "Veteran ID" },
  { value: "passport_id", label: "Passport ID" },
]

const GA_DEFAULT_METHODS = ["full_name", "address", "dl_number"]
const OTHER_DEFAULT_METHODS = ["full_name", "address", "signature"]

export default function CreateTenantModal({ onClose, onCreated }) {
  const notify = useNotify()
  const [form, setForm] = useState({
    name: "",
    slug: "",
    admin_email: "",
    admin_password: "",
    requests_per_minute: 120,
    processing_mode: "manual",
    jurisdiction_state: "",
    cure_notification_method: "email",
  })
  const [verificationMethods, setVerificationMethods] = useState(OTHER_DEFAULT_METHODS)
  const [methodsTouched, setMethodsTouched] = useState(false)
  const [error, setError] = useState("")

  const update = (field) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    if (field === "jurisdiction_state" && !methodsTouched) {
      setVerificationMethods(value.toUpperCase() === "GA" ? GA_DEFAULT_METHODS : OTHER_DEFAULT_METHODS)
    }
  }

  const toggleMethod = (method) => {
    setMethodsTouched(true)
    setVerificationMethods((methods) =>
      methods.includes(method) ? methods.filter((m) => m !== method) : [...methods, method]
    )
  }

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/superadmin/tenants", {
        ...form,
        requests_per_minute: Number(form.requests_per_minute) || 120,
        jurisdiction_state: form.jurisdiction_state ? form.jurisdiction_state.toUpperCase() : null,
        verification_methods: verificationMethods,
      }),
    onSuccess: () => {
      notify(`Tenant ${form.name} created`, "success")
      onCreated()
      onClose()
    },
    onError: (err) => {
      const message = err.response?.data?.detail || "Could not create tenant."
      setError(message)
      notify(message, "error")
    },
  })

  const submit = (e) => {
    e.preventDefault()
    setError("")
    createMutation.mutate()
  }

  return (
    <Modal title="Create Tenant" onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
              {error}
            </div>
          )}
          <Field label="Organization name" value={form.name} onChange={update("name")} required />
          <Field label="Slug" value={form.slug} onChange={update("slug")} required placeholder="acme-county" />
          <Field label="Admin email" type="email" value={form.admin_email} onChange={update("admin_email")} required />
          <Field label="Admin password" type="password" value={form.admin_password} onChange={update("admin_password")} required />
          <Field
            label="Rate limit (req/min)"
            type="number"
            value={form.requests_per_minute}
            onChange={update("requests_per_minute")}
          />

          <div>
            <label htmlFor="processing-mode" className="block text-sm font-medium mb-1.5">
              Processing mode
            </label>
            <select
              id="processing-mode"
              value={form.processing_mode}
              onChange={update("processing_mode")}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)" }}
            >
              <option value="manual">Manual Mode (clerk data entry)</option>
              <option value="scan">Scan Mode (OCR / Document AI)</option>
            </select>
          </div>

          <Field
            label="Jurisdiction state (2-letter, optional)"
            value={form.jurisdiction_state}
            onChange={update("jurisdiction_state")}
            placeholder="GA"
            maxLength={2}
          />

          <div>
            <label htmlFor="cure-notify" className="block text-sm font-medium mb-1.5">
              Cure notification method
            </label>
            <select
              id="cure-notify"
              value={form.cure_notification_method}
              onChange={update("cure_notification_method")}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)" }}
            >
              <option value="email">Email</option>
              <option value="mail">Physical mail</option>
              <option value="both">Email + physical mail</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Verification checklist</label>
            <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>
              Defaults to GA's Full Name + Address + DL Number, or Full Name + Address + Signature otherwise. Adjust
              as needed for this jurisdiction.
            </p>
            <div className="space-y-1.5">
              {VERIFICATION_METHOD_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationMethods.includes(opt.value)}
                    onChange={() => toggleMethod(opt.value)}
                    className="h-4 w-4 cursor-pointer"
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2 text-sm font-medium" style={{ color: "var(--color-muted)" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              {createMutation.isPending ? "Creating…" : "Create tenant"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
