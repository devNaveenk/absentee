import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider } from "./context/AuthContext"
import ApplicationDetail from "./pages/ApplicationDetail"
import ApplicationsQueue from "./pages/ApplicationsQueue"
import Login from "./pages/Login"
import NewApplication from "./pages/NewApplication"
import NewReturnedBallot from "./pages/NewReturnedBallot"
import ReturnedBallotDetail from "./pages/ReturnedBallotDetail"
import ReturnedBallotsQueue from "./pages/ReturnedBallotsQueue"
import SuperadminDashboard from "./pages/SuperadminDashboard"
import TenantDashboard from "./pages/TenantDashboard"
import VotersPage from "./pages/VotersPage"

const TENANT_ROLES = ["tenant_admin", "tenant_user"]

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowRoles={TENANT_ROLES}>
                <TenantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowRoles={TENANT_ROLES}>
                <ApplicationsQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/new"
            element={
              <ProtectedRoute allowRoles={TENANT_ROLES}>
                <NewApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute allowRoles={TENANT_ROLES}>
                <ApplicationDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returned-ballots"
            element={
              <ProtectedRoute allowRoles={TENANT_ROLES}>
                <ReturnedBallotsQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returned-ballots/new"
            element={
              <ProtectedRoute allowRoles={TENANT_ROLES}>
                <NewReturnedBallot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returned-ballots/:id"
            element={
              <ProtectedRoute allowRoles={TENANT_ROLES}>
                <ReturnedBallotDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voters"
            element={
              <ProtectedRoute allowRoles={TENANT_ROLES}>
                <VotersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowRoles={["superadmin"]}>
                <SuperadminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
