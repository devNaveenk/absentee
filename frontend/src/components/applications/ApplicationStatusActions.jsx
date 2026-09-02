import VerificationChecklist from "../VerificationChecklist"

/** Renders whichever status-dependent action block applies: the
 *  approve/cure/reject decision panel (unprocessed), the "mark ABS sent"
 *  banner (approved), or the cure-in-progress banner (cure). Exactly one
 *  (or none) renders per application status. */
export default function ApplicationStatusActions({
  application,
  canDecide,
  verificationMethods,
  checklist,
  setChecklist,
  allChecked,
  busy,
  handleApprove,
  handleMarkAbsSent,
  setShowCure,
  setShowReject,
  setShowReapply,
}) {
  return (
    <>
      {canDecide && (
        <VerificationChecklist
          methods={verificationMethods}
          checklist={checklist}
          onChange={(method, value) => setChecklist((c) => ({ ...c, [method]: value }))}
        />
      )}

      {canDecide && (
        <section
          className="rounded-xl border p-5 mb-6 flex flex-wrap gap-3"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <button
            onClick={handleApprove}
            disabled={busy || !application.voter_id || !allChecked}
            title={
              !application.voter_id
                ? "Match a voter before approving"
                : !allChecked
                  ? "Complete the verification checklist before approving"
                  : undefined
            }
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            Approve
          </button>
          <button
            onClick={() => setShowCure(true)}
            disabled={busy}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium border disabled:opacity-50"
            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
          >
            Move to Cure
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={busy}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}
          >
            Reject
          </button>
        </section>
      )}

      {application.status === "approved" && (
        <section
          className="rounded-xl border p-5 mb-6 flex flex-wrap items-center justify-between gap-3"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Approved and awaiting ballot packet mail-out.
          </p>
          <button
            onClick={handleMarkAbsSent}
            disabled={busy}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            Mark ABS Sent
          </button>
        </section>
      )}

      {application.status === "cure" && (
        <section
          className="rounded-xl border p-5 mb-6"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold">Cure in progress</h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Reason: {application.cure_reason?.replaceAll("_", " ")} · Notified via{" "}
                {application.cure_notified_via}
              </p>
            </div>
            <button
              onClick={() => setShowReapply(true)}
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              File Reapplication
            </button>
          </div>
        </section>
      )}
    </>
  )
}
