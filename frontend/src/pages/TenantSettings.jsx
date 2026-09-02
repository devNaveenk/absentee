import { useSearchParams } from "react-router-dom"
import AppShell from "../components/AppShell"
import BackButton from "../components/BackButton"
import BrandingTab from "../components/settings/BrandingTab"
import ProcessingModeTab from "../components/settings/ProcessingModeTab"
import ReasonListsTab from "../components/settings/ReasonListsTab"
import TeamTab from "../components/settings/TeamTab"
import { useTenantSettings } from "../hooks/useTenantSettings"

const TABS = [
  { value: "processing-mode", label: "Processing Mode" },
  { value: "reasons", label: "Reason Lists" },
  { value: "branding", label: "Branding" },
  { value: "team", label: "Team" },
]

export default function TenantSettings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = TABS.some((t) => t.value === searchParams.get("tab")) ? searchParams.get("tab") : "processing-mode"
  const { tenant, loading, processingMode, reasons, brandingState, team } = useTenantSettings()

  if (loading) {
    return (
      <AppShell role="tenant">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-muted-bg)" }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell role="tenant">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BackButton fallback="/dashboard" />
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
          Settings
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
          Configure processing mode, reason lists, branding, and your team.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSearchParams({ tab: t.value })}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150"
              style={
                activeTab === t.value
                  ? { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }
                  : { backgroundColor: "var(--color-muted-bg)", color: "var(--color-muted)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "processing-mode" && <ProcessingModeTab tenant={tenant} {...processingMode} />}
        {activeTab === "reasons" && <ReasonListsTab {...reasons} />}
        {activeTab === "branding" && <BrandingTab tenant={tenant} {...brandingState} />}
        {activeTab === "team" && <TeamTab {...team} />}
      </div>
    </AppShell>
  )
}
