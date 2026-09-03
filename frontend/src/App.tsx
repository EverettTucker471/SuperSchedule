import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import CalendarImport from "./pages/CalendarImport"
import Preferences from "./pages/Preferences"
import Optimize from "./pages/Optimize"
import "./App.css"

function ProtectedLayout() {
  const { user, loading, configured } = useAuth()
  if (loading) return <p className="loading">Loading session...</p>
  if (configured && !user) return <Navigate to="/login" replace />
  return <Layout />
}

function AppRoutes() {
  const { user, loading, configured } = useAuth()
  return (
    <Routes>
      <Route
        path="/login"
        element={configured && !loading && user ? <Navigate to="/calendar" replace /> : <Login />}
      />
      <Route element={<ProtectedLayout />}>
        <Route path="/calendar" element={<CalendarImport />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/optimize" element={<Optimize />} />
      </Route>
      <Route
        path="/"
        element={<Navigate to={configured && user ? "/calendar" : "/login"} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
