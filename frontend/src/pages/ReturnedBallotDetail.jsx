import AppShell from "../components/AppShell"
import AuditHistoryList from "../components/AuditHistoryList"
import BallotDecisionActions from "../components/returned-ballots/BallotDecisionActions"
import BallotVoterProfilePanel from "../components/returned-ballots/BallotVoterProfilePanel"
import EnvelopeCard from "../components/returned-ballots/EnvelopeCard"
import RejectBallotModal from "../components/returned-ballots/RejectBallotModal"
import SignatureComparisonPanel from "../components/returned-ballots/SignatureComparisonPanel"
import { useReturnedBallotDetail } from "../hooks/useReturnedBallotDetail"

const STATUS_LABELS = {
  received: "Pending Verification",
  verified: "Verified — Final Bin",
  rejected: "Rejected",
}

export default function ReturnedBallotDetail() {
  const d = useReturnedBallotDetail()

  if (d.loading) {
    return (
      <AppShell role="tenant">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
        </div>
      </AppShell>
    )
  }

  if (d.error || !d.ballot) {
    return (
      <AppShell role="tenant">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div role="alert" className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            {d.error || "Returned ballot not found."}
          </div>
        </div>
      </AppShell>
    )
  }

  const { ballot } = d

  return (
    <AppShell role="tenant">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>
              Returned Ballot {ballot.tracking_number}
            </p>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-foreground)" }}>
              {ballot.submitted_full_name}
            </h1>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
          >
            {STATUS_LABELS[ballot.status]}
          </span>
        </div>

        {d.actionError && (
          <div role="alert" className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            {d.actionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <EnvelopeCard ballot={ballot} envelopeImageUrl={d.envelopeImageUrl} />
          <BallotVoterProfilePanel
            ballot={ballot}
            verificationMethods={d.verificationMethods}
            canDecide={d.canDecide}
            signatureUrl={d.signatureUrl}
            handleMatchVoter={d.handleMatchVoter}
          />
        </div>

        <SignatureComparisonPanel
          ballot={ballot}
          requestSignatureUrl={d.requestSignatureUrl}
          envelopeImageUrl={d.envelopeImageUrl}
          signatureUrl={d.signatureUrl}
        />

        <BallotDecisionActions
          ballot={ballot}
          canDecide={d.canDecide}
          verificationMethods={d.verificationMethods}
          checklist={d.checklist}
          setChecklist={d.setChecklist}
          allChecked={d.allChecked}
          busy={d.busy}
          handleVerify={d.handleVerify}
          setShowReject={d.setShowReject}
        />

        <AuditHistoryList events={ballot.events} />
      </div>

      {d.showReject && (
        <RejectBallotModal
          rejectReason={d.rejectReason}
          setRejectReason={d.setRejectReason}
          rejectionReasons={d.rejectionReasons}
          onClose={() => d.setShowReject(false)}
          onConfirm={d.handleReject}
          busy={d.busy}
        />
      )}
    </AppShell>
  )
}
