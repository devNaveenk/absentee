import DetailRow from "../DetailRow"
import VoterSearchInput from "../VoterSearchInput"

export default function BallotVoterProfilePanel({ ballot, verificationMethods, canDecide, signatureUrl, handleMatchVoter }) {
  return (
    <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-base font-semibold mb-4">Unified Voter Profile</h2>

      {ballot.voter ? (
        <>
          <dl className="space-y-3 text-sm">
            <DetailRow label="Full name" value={ballot.voter.full_name} required={verificationMethods.includes("full_name")} />
            <DetailRow label="Registered address" value={ballot.voter.registered_address} required={verificationMethods.includes("address")} />
            <DetailRow label="DL number" value={ballot.voter.dl_number || "—"} required={verificationMethods.includes("dl_number")} />
          </dl>
          {ballot.voter.has_signature && (
            <div className="mt-4">
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
                Signature on file
              </p>
              {signatureUrl ? (
                <img src={signatureUrl} alt="Voter signature" className="rounded-lg border bg-white max-h-32" style={{ borderColor: "var(--color-border)" }} />
              ) : (
                <div className="h-24 w-64 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
              )}
            </div>
          )}
          {canDecide && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium underline" style={{ color: "var(--color-accent)" }}>
                Change matched voter
              </summary>
              <div className="mt-2">
                <VoterSearchInput onSelect={handleMatchVoter} />
              </div>
            </details>
          )}
        </>
      ) : (
        <div>
          <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>
            No voter matched yet. Search to link this ballot to a voter record.
          </p>
          <VoterSearchInput onSelect={handleMatchVoter} />
        </div>
      )}
    </section>
  )
}
