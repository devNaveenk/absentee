import VerificationChecklist from "../VerificationChecklist"

export default function BallotDecisionActions({
  ballot,
  canDecide,
  verificationMethods,
  checklist,
  setChecklist,
  allChecked,
  busy,
  handleVerify,
  setShowReject,
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
            onClick={handleVerify}
            disabled={busy || !ballot.voter_id || !allChecked}
            title={
              !ballot.voter_id
                ? "Match a voter before final approval"
                : !allChecked
                  ? "Complete the verification checklist before final approval"
                  : undefined
            }
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            Final Approval → Final Bin
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

      {ballot.status === "rejected" && ballot.rejection_reason && (
        <section className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <p className="text-sm">
            <span className="font-medium">Rejected:</span>{" "}
            {ballot.rejection_reason?.replaceAll("_", " ")}
          </p>
        </section>
      )}
    </>
  )
}
