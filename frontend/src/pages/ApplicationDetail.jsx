import AppShell from "../components/AppShell"
import ApplicationStatusActions from "../components/applications/ApplicationStatusActions"
import CureApplicationModal from "../components/applications/CureApplicationModal"
import ReapplyModal from "../components/applications/ReapplyModal"
import RejectApplicationModal from "../components/applications/RejectApplicationModal"
import SubmittedApplicationCard from "../components/applications/SubmittedApplicationCard"
import VoterProfilePanel from "../components/applications/VoterProfilePanel"
import AuditHistoryList from "../components/AuditHistoryList"
import { useApplicationDetail } from "../hooks/useApplicationDetail"

const STATUS_LABELS = {
  unprocessed: "Unprocessed",
  approved: "Approved — Pending ABS Mail-out",
  abs_sent: "ABS Sent",
  rejected: "Rejected",
  cure: "Cure",
  reapproved: "Reapproved",
}

export default function ApplicationDetail() {
  const d = useApplicationDetail()

  if (d.loading) {
    return (
      <AppShell role="tenant">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
        </div>
      </AppShell>
    )
  }

  if (d.error || !d.application) {
    return (
      <AppShell role="tenant">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div role="alert" className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            {d.error || "Application not found."}
          </div>
        </div>
      </AppShell>
    )
  }

  const { application } = d

  return (
    <AppShell role="tenant">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
              Application {application.application_number}
              {application.is_reapproval && " · Reapproval"}
            </p>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              {application.submitted_full_name}
            </h1>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
          >
            {STATUS_LABELS[application.status]}
          </span>
        </div>

        {d.actionError && (
          <div role="alert" className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            {d.actionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <SubmittedApplicationCard
            application={application}
            canDecide={d.canDecide}
            editing={d.editing}
            setEditing={d.setEditing}
            editForm={d.editForm}
            setEditForm={d.setEditForm}
            receivedViaOptions={d.receivedViaOptions}
            busy={d.busy}
            handleSaveEdit={d.handleSaveEdit}
            scanImageUrl={d.scanImageUrl}
            requestSignatureUrl={d.requestSignatureUrl}
          />
          <VoterProfilePanel
            application={application}
            verificationMethods={d.verificationMethods}
            canDecide={d.canDecide}
            signatureUrl={d.signatureUrl}
            handleMatchVoter={d.handleMatchVoter}
          />
        </div>

        <ApplicationStatusActions
          application={application}
          canDecide={d.canDecide}
          verificationMethods={d.verificationMethods}
          checklist={d.checklist}
          setChecklist={d.setChecklist}
          allChecked={d.allChecked}
          busy={d.busy}
          handleApprove={d.handleApprove}
          handleMarkAbsSent={d.handleMarkAbsSent}
          setShowCure={d.setShowCure}
          setShowReject={d.setShowReject}
          setShowReapply={d.setShowReapply}
        />

        <AuditHistoryList events={application.events} />
      </div>

      {d.showReject && (
        <RejectApplicationModal
          rejectReason={d.rejectReason}
          setRejectReason={d.setRejectReason}
          rejectionReasons={d.rejectionReasons}
          onClose={() => d.setShowReject(false)}
          onConfirm={d.handleReject}
          busy={d.busy}
        />
      )}

      {d.showCure && (
        <CureApplicationModal
          cureReason={d.cureReason}
          setCureReason={d.setCureReason}
          cureReasons={d.cureReasons}
          notifyVia={d.notifyVia}
          setNotifyVia={d.setNotifyVia}
          onClose={() => d.setShowCure(false)}
          onConfirm={d.handleCure}
          busy={d.busy}
        />
      )}

      {d.showReapply && (
        <ReapplyModal
          reapplyForm={d.reapplyForm}
          setReapplyForm={d.setReapplyForm}
          onClose={() => d.setShowReapply(false)}
          onConfirm={d.handleReapply}
          busy={d.busy}
        />
      )}
    </AppShell>
  )
}
