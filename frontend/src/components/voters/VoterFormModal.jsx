import { useState } from "react"
import { useNotify } from "../../context/NotificationContext"
import { api } from "../../lib/api"
import FormField from "../FormField"
import Modal, { ModalActions } from "../Modal"

const EMPTY_FORM = {
  full_name: "",
  registered_address: "",
  external_voter_id: "",
  dl_number: "",
  veteran_id: "",
  passport_id: "",
  date_of_birth: "",
}

export default function VoterFormModal({ voter, onClose, onSaved }) {
  const notify = useNotify()
  const isEdit = !!voter
  const [form, setForm] = useState(
    voter
      ? {
          full_name: voter.full_name || "",
          registered_address: voter.registered_address || "",
          external_voter_id: voter.external_voter_id || "",
          dl_number: voter.dl_number || "",
          veteran_id: voter.veteran_id || "",
          passport_id: voter.passport_id || "",
          date_of_birth: "",
        }
      : EMPTY_FORM
  )
  const [signatureFile, setSignatureFile] = useState(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const toPayload = () => ({
    full_name: form.full_name,
    registered_address: form.registered_address,
    external_voter_id: form.external_voter_id || null,
    dl_number: form.dl_number || null,
    veteran_id: form.veteran_id || null,
    passport_id: form.passport_id || null,
    date_of_birth: form.date_of_birth || null,
  })

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const voterId = isEdit
        ? (await api.patch(`/voters/${voter.id}`, toPayload())).data.id
        : (await api.post("/voters", toPayload())).data.id

      if (signatureFile) {
        const formData = new FormData()
        formData.append("file", signatureFile)
        await api.post(`/voters/${voterId}/signature`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      notify(isEdit ? `Updated ${form.full_name}` : `Added ${form.full_name} to the voter roll`, "success")
      onSaved()
    } catch (err) {
      const message = err.response?.data?.detail || "Could not save voter."
      setError(message)
      notify(message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEdit ? "Edit Voter" : "Add Voter"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            {error}
          </div>
        )}
        <FormField idPrefix="voter-field" label="Full name" value={form.full_name} onChange={update("full_name")} required />
        <FormField idPrefix="voter-field" label="Registered address" value={form.registered_address} onChange={update("registered_address")} required />
        <FormField idPrefix="voter-field" label="External voter ID (optional)" value={form.external_voter_id} onChange={update("external_voter_id")} />
        <FormField idPrefix="voter-field" label="Driver's License number (optional)" value={form.dl_number} onChange={update("dl_number")} />
        <FormField idPrefix="voter-field" label="Veteran ID (optional)" value={form.veteran_id} onChange={update("veteran_id")} />
        <FormField idPrefix="voter-field" label="Passport ID (optional)" value={form.passport_id} onChange={update("passport_id")} />
        <FormField idPrefix="voter-field" label="Date of birth (optional)" type="date" value={form.date_of_birth} onChange={update("date_of_birth")} />

        <div>
          <label htmlFor="signature-file" className="block text-sm font-medium mb-1.5">
            Signature image {isEdit && voter.has_signature ? "(replace, optional)" : "(optional)"}
          </label>
          <input
            id="signature-file"
            type="file"
            accept="image/*"
            onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </div>

        <ModalActions onCancel={onClose} onConfirm={submit} confirmLabel={isEdit ? "Save changes" : "Add voter"} busy={submitting} />
      </form>
    </Modal>
  )
}
