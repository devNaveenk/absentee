import { createContext, useContext, useMemo, useState } from "react"
import { api } from "../lib/api"

const AuthContext = createContext(null)

function readSession() {
  try {
    const raw = localStorage.getItem("ballotda_session")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  const login = async ({ email, password, tenantSlug }) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
      tenant_slug: tenantSlug || null,
    })
    localStorage.setItem("ballotda_token", data.access_token)
    const nextSession = { email: data.email, role: data.role, tenantSlug: data.tenant_slug }
    localStorage.setItem("ballotda_session", JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession
  }

  const logout = () => {
    localStorage.removeItem("ballotda_token")
    localStorage.removeItem("ballotda_session")
    setSession(null)
  }

  const value = useMemo(() => ({ session, login, logout }), [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
