import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GorillaGuard from '../components/GorillaGuard'

export default function Login() {
  const { signIn } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error)
      show('Login failed. Check your credentials.', 'error')
      return
    }
    show('Welcome back!', 'success')
    navigate(from, { replace: true })
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-3xl p-8">
        <GorillaGuard value={password} visible={showPassword} focused={focused} />

        <h1 className="font-display text-2xl text-center mt-4 mb-1 text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-muted text-center mb-7">Log in to keep your streak going.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm px-3 py-2.5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Email</label>
            <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 focus-within:border-accent-violet/60">
              <Mail size={16} className="text-text-faint" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Password</label>
            <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 focus-within:border-accent-violet/60">
              <Lock size={16} className="text-text-faint" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-text-faint hover:text-text-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-accent-cyan hover:underline">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim disabled:opacity-60"
          >
            <LogIn size={16} /> {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          New here? <Link to="/signup" className="text-accent-cyan hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
