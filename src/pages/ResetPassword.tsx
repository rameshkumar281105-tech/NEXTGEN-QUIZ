import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GorillaGuard from '../components/GorillaGuard'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) {
      setError(error)
      show('Could not update password. The reset link may have expired.', 'error')
      return
    }
    show('Password updated. You can log in with it now.', 'success')
    navigate('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-3xl p-8">
        <GorillaGuard value={password} visible={showPassword} focused={focused} />
        <h1 className="font-display text-2xl text-center mt-4 mb-1 text-text-primary">Set a new password</h1>
        <p className="text-sm text-text-muted text-center mb-7">Open this page from the reset link in your email.</p>

        {error && <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm px-3 py-2.5">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">New password</label>
            <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 focus-within:border-accent-violet/60">
              <Lock size={16} className="text-text-faint" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
                placeholder="At least 6 characters"
                className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-text-faint hover:text-text-primary">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Confirm new password</label>
            <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 focus-within:border-accent-violet/60">
              <Lock size={16} className="text-text-faint" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repeat password"
                className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim disabled:opacity-60"
          >
            <ShieldCheck size={16} /> {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
