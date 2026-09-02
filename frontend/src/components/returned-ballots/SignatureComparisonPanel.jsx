function SignaturePanel({ label, url, present }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
        {label}
      </p>
      {!present ? (
        <div
          className="h-24 rounded-lg border flex items-center justify-center text-xs"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
        >
          Not on file
        </div>
      ) : url ? (
        <img src={url} alt={label} className="rounded-lg border bg-white max-h-24 w-full object-contain" style={{ borderColor: "var(--color-border)" }} />
      ) : (
        <div className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
      )}
    </div>
  )
}

export default function SignatureComparisonPanel({ ballot, requestSignatureUrl, envelopeImageUrl, signatureUrl }) {
  const hasAnySignatureSource = ballot.original_application?.has_signature || ballot.has_envelope_scan || ballot.voter?.has_signature
  if (!hasAnySignatureSource) return null

  return (
    <section className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-base font-semibold mb-4">Signature Comparison</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SignaturePanel label="Request Form Signature" url={requestSignatureUrl} present={ballot.original_application?.has_signature} />
        <SignaturePanel label="Envelope Signature" url={envelopeImageUrl} present={ballot.has_envelope_scan} />
        <SignaturePanel label="Voter Profile Signature" url={signatureUrl} present={ballot.voter?.has_signature} />
      </div>
    </section>
  )
}
