import { NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import ConfigBanner from "./ConfigBanner"

export default function Layout() {
  const { user, configured, signOut } = useAuth()
  const email = user?.email || (configured ? "Signed in" : "Preview (no env)")

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <strong>SuperSchedule</strong>
          <nav>
            <NavLink to="/calendar">Calendar</NavLink>
            <NavLink to="/preferences">Preferences</NavLink>
            <NavLink to="/optimize">Optimize (stub)</NavLink>
          </nav>
        </div>
        <div className="topbar-user">
          <span>{email}</span>
          {user ? (
            <button type="button" className="ghost" onClick={() => void signOut()}>
              Sign out
            </button>
          ) : null}
        </div>
      </header>
      <ConfigBanner />
      <Outlet />
    </div>
  )
}
