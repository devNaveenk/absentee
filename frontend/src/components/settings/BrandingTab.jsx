import { useAuthedObjectUrl } from "../../hooks/useAuthedObjectUrl"

const CURRENCIES = ["USD", "EUR", "GBP", "CAD"]

export default function BrandingTab({
  tenant,
  branding,
  setBranding,
  savingBranding,
  saveBranding,
  logoFile,
  setLogoFile,
  uploadingLogo,
  uploadLogo,
}) {
  const logoUrl = useAuthedObjectUrl(tenant?.has_logo ? "/tenant/settings/branding/logo" : null)

  return (
    <section className="rounded-xl border p-5" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <h2 className="text-base font-semibold mb-4">Branding</h2>
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>Display name</label>
          <input
            value={branding.display_name}
            onChange={(e) => setBranding((b) => ({ ...b, display_name: e.target.value }))}
            placeholder={tenant?.name}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--color-border)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>Currency</label>
          <select
            value={branding.currency}
            onChange={(e) => setBranding((b) => ({ ...b, currency: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer"
            style={{ borderColor: "var(--color-border)" }}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={saveBranding}
        disabled={savingBranding}
        className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
      >
        {savingBranding ? "Saving…" : "Save branding"}
      </button>

      <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-sm font-medium mb-2">Logo</p>
        {logoUrl && <img src={logoUrl} alt="Current logo" className="h-10 w-auto mb-3" />}
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-sm" />
          <button
            onClick={uploadLogo}
            disabled={!logoFile || uploadingLogo}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: "var(--color-muted-bg)", color: "var(--color-primary)" }}
          >
            {uploadingLogo ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </section>
  )
}
