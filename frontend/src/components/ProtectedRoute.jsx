import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children, allowRoles }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }
  if (allowRoles && !allowRoles.includes(session.role)) {
    return <Navigate to={session.role === "superadmin" ? "/superadmin" : "/dashboard"} replace />
  }
  return children
}
