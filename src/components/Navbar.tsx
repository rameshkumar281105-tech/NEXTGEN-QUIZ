import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Brain, Menu, X, LogOut, LayoutDashboard, Trophy, ListChecks, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const links = [
  { to: '/quizzes', label: 'Quizzes', icon: ListChecks },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/create', label: 'Create', icon: PlusCircle },
]

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    show('Signed out. See you next round!', 'success')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-bg-border bg-bg/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg text-text-primary">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan text-bg">
            <Brain size={18} />
          </span>
          NextGen<span className="text-gradient">Quiz</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-text-primary bg-bg-elevated' : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/60'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-elevated/60"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>
              <Link to="/profile" className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-bg-elevated/60">
                <span className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-amber to-accent-violet grid place-items-center text-xs font-bold text-bg">
                  {profile?.name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-danger"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary">
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-accent-violet text-white hover:bg-accent-violetDim transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-text-primary" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-bg-border bg-bg px-4 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-bg-elevated"
            >
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/dashboard" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-bg-elevated">
                Dashboard
              </NavLink>
              <NavLink to="/profile" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-bg-elevated">
                Profile
              </NavLink>
              <button onClick={handleSignOut} className="px-3 py-2.5 rounded-lg text-sm font-medium text-danger text-left">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-bg-elevated">
                Log in
              </NavLink>
              <NavLink to="/signup" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold bg-accent-violet text-white text-center">
                Get started
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  )
}
